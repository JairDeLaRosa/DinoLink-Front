<script setup>
import { roomId } from "@/roomStore";  
import socket from "@/socket";
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const home = ref(true)
const matchmaking = ref("")
const title = ref('')
const router = useRouter()

const fullText = 'Dino Link'
const typingSpeed = 100
const eraseSpeed = 50
const pauseBetween = 3000

// Lógica del título animado
const startTyping = () => {
  let isDeleting = false
  let i = 0

  const typeWriter = () => {
    const currentText = fullText.substring(0, i)
    title.value = currentText

    if (!isDeleting && i === fullText.length) {
      isDeleting = true
      setTimeout(typeWriter, pauseBetween)
      return
    }

    if (isDeleting && i === 0) {
      isDeleting = false
      setTimeout(typeWriter, typingSpeed)
      return
    }

    i += isDeleting ? -1 : 1
    setTimeout(typeWriter, isDeleting ? eraseSpeed : typingSpeed)
  }

  typeWriter()
}

// Función para entrar a matchmaking
const emparejar = () => {
  socket.emit("join-matchmaking")
  home.value = false
}

// Registrar listeners una sola vez
onMounted(() => {
  startTyping()

  socket.on("matchmaking-status", (data) => {
    matchmaking.value = data.status
  })

  socket.on("matched", (data) => {
    // Puedes usar un toast o solo redirigir directamente
    console.log('🔗 Emparejado, entrando a sala:', data.roomId)
    roomId.value = data.roomId
    router.push('/game')
  })
})

// Limpiar listeners
onUnmounted(() => {
  socket.off("matchmaking-status")
  socket.off("matched")
})
</script>

<template>
  <div v-if="home" class="home">
    <h1 class="pixelify-sans-title">->{{ title }}<-</h1>
    <svg viewBox="0 0 428 459" shape-rendering="optimizeSpeed" style="width: 300px; height: 400px;">
      <path
        d="M86 374v-22H65v-21H43v-21H22v-22H0V160h22v43h21v21h22v22h42v-22h22v-21h32v-21h32v-22h21V22h21V0h171v22h22v96H321v21h64v21h-86v43h43v43h-21v-22h-22v75h-21v32h-21v21h-22v22zM278 32h-21v22h21z" />
      <path id="L" d="M86 352h64v43h-21v21h-21v22h21v21H86z" />
      <path id="R" d="M235 352v86h22v21h-43v-64h-21v-43z" />
    </svg>
    <div class="mt-2">
      <button class="button-89" @click="emparejar"><span class="emparejar">Match</span></button>
    </div>
  </div>
  <div v-else class="home">
    <div class="spinner-border" role="status"></div>
    <span class="mt-3">{{ matchmaking }}</span>
  </div>
</template>


<style scoped>
.home {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom,#727272 , #f0f0f0);
}

svg {
  fill: #303030;
}

[id=L],
[id=R] {
  animation: leg 0.6s infinite steps(2);
}

[id=R] {
  animation-delay: -0.3s;
}

@keyframes leg {
  to {
    transform: translateY(-10%);
  }
}


svg {
  max-width: 60vmin;
}

/* CSS */
.button-89 {
  margin-bottom: 20px;
  width: 200px;
  height: 100px;
  --b: 3px;   /* border thickness */
  --s: .45em; /* size of the corner */
  --color: #373B44;
  
  padding: calc(.5em + var(--s)) calc(.9em + var(--s));
  color: var(--color);
  --_p: var(--s);
  background:
    conic-gradient(from 90deg at var(--b) var(--b),#0000 90deg,var(--color) 0)
    var(--_p) var(--_p)/calc(100% - var(--b) - 2*var(--_p)) calc(100% - var(--b) - 2*var(--_p));
  transition: .3s linear, color 0s, background-color 0s;
  outline: var(--b) solid #0000;
  outline-offset: .6em;
  font-size: 16px;

  border: 0;

  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.button-89:hover,
.button-89:focus-visible{
  --_p: 0px;
  outline-color: var(--color);
  outline-offset: .05em;
}

.button-89:active {
  background: var(--color);
  color: #fff;
}
</style>
