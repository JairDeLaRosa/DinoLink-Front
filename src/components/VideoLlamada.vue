<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import socket from '@/socket'
import { roomId } from '@/roomStore'

const localVideo = ref(null)
const remoteVideo = ref(null)
let peerConnection = null
let localStream = null

// Función para inicializar la conexión
async function initCall() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  localVideo.value.srcObject = localStream

  peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
      { urls: "stun:stun.l.google.com:19302" },  // Google (alta disponibilidad)
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun.voipbuster.com:3478" }, // Alternativa a Google
      { urls: "stun:stun.voipstunt.com:3478" },
      { urls: "stun:stun.mozilla.org:3478" },    // Mozilla (para pruebas)
      { urls: "stun:stun.iptel.org:3478" },      // Otro confiable
      { urls: "stun:stun.ideasip.com:3478" },
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: "turn:global.relay.metered.ca:80",
        username: "569f6e3d41d61689409bdd73",
        credential: "cFqkx5K8MprYCv1b",
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "569f6e3d41d61689409bdd73",
        credential: "cFqkx5K8MprYCv1b",
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: "569f6e3d41d61689409bdd73",
        credential: "cFqkx5K8MprYCv1b",
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: "569f6e3d41d61689409bdd73",
        credential: "cFqkx5K8MprYCv1b",
      },
    ]
  })

  // Añadir tracks locales
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream)
  })

  // Mostrar video remoto
  peerConnection.ontrack = event => {
    if (event.streams && event.streams[0]) {
      remoteVideo.value.srcObject = event.streams[0]
      console.log('✅ Recibiendo video remoto')
    }
  }

  // Enviar candidatos ICE
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      console.log('📤 Enviando ICE candidate')
      socket.emit('rtc-signal', {
        type: 'candidate',
        roomId: roomId.value,
        payload: event.candidate
      })
    }
  }

  // Manejar señales entrantes
  socket.off('rtc-signal')
  socket.on('rtc-signal', async ({ type, payload }) => {
    console.log(`📥 Recibida señal: ${type}`)

    if (!peerConnection) return

    if (type === 'offer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      socket.emit('rtc-signal', {
        type: 'answer',
        roomId: roomId.value,
        payload: answer
      })
    } else if (type === 'answer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload))
    } else if (type === 'candidate') {
      await peerConnection.addIceCandidate(new RTCIceCandidate(payload))
    }
  })

  // Emitir que está listo para la llamada
  socket.emit('ready-for-call', { roomId: roomId.value })

  socket.once('start-call', async () => {
    console.log('🎬 Iniciando llamada, creando oferta...')
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    socket.emit('rtc-signal', {
      type: 'offer',
      roomId: roomId.value,
      payload: offer
    })
  })
}

// Inicia la videollamada cuando el componente se monta
onMounted(() => {
  initCall()
})

// Limpieza al salir
onBeforeUnmount(() => {
  socket.off('rtc-signal')
  socket.off('start-call')
  if (peerConnection) peerConnection.close()
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop())
  }
})
</script>

<template>
  <div class="video-call">
    <video ref="localVideo" autoplay playsinline muted class="rounded-xl shadow-md w-1/2" />
    <video ref="remoteVideo" autoplay playsinline class="rounded-xl shadow-md w-1/2" />
  </div>
</template>


<style scoped>
.video-call {
  margin-left: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

video {
  width: 52vh;
  padding: 10px;
  height: 40vh;
  background: linear-gradient(to bottom, #4b4b7e, #222238);
  border-radius: 10px;
}
</style>