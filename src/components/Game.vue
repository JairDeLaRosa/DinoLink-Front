<script setup>
import VideoLLamada from './VideoLlamada.vue'
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import socket from "@/socket";
const messages = ref([])
const message = ref('')
const chatContainer = ref(null)
function scrollToBottom() {
    nextTick(() => {
        if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight
        }
    })
}
onMounted(() => {
    socket.on("new-message", (data) => {
        messages.value.push(
            {
                rol: 'contact',
                message: data.content
            })
        console.log(messages.value)
    });
});
const sendMessage = (e) => {
    e.preventDefault()
    if (message.value != '') {
        socket.emit("send-message", message.value)
        messages.value.push({
            rol: 'mainUser',
            message: message.value
        })
        message.value = ''
    }

}
onUnmounted(() => {
    socket.off("new-message");
});
// Auto-scroll cuando cambian los mensajes
watch(messages, scrollToBottom, { deep: true })

// Scroll al final al montar el componente
onMounted(scrollToBottom)
</script>
<template>
    <VideoLLamada/>
    <div class="background">
        <div class="col-md-8 col-xl-6 chat game">
            <div class="card">

                <div class="card-body msg_card_body" ref="chatContainer">
                    <div v-for="message in messages">
                        <div v-if="message.rol === 'contact'" class="d-flex justify-content-start mb-4">
                            <div class="img_cont_msg">
                                <img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg"
                                    class="rounded-circle user_img_msg">
                            </div>
                            <div class="msg_cotainer">
                                {{ message.message }}
                            </div>
                        </div>
                        <div v-else class="d-flex justify-content-end mb-4">
                            <div class="msg_cotainer_send">
                                {{ message.message }}

                            </div>
                            <div class="img_cont_msg">
                                <img src="#" class="rounded-circle user_img_msg">
                            </div>
                        </div>
                    </div>


                </div>
                <div class="card-footer">
                    <div class="input-group">
                        <div class="input-group-append">

                        </div>
                        <textarea name="" class="form-control type_msg" placeholder="Type your message..."
                            v-model="message" @keydown.enter.prevent="sendMessage"></textarea>
                        <div class="input-group-append">
                            <form @submit="sendMessage"><button type="submit" class="input-group-text send_btn"><svg
                                        xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                        class="bi bi-send" viewBox="0 0 16 16">
                                        <path
                                            d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                                    </svg></button></form>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>

<style scoped>
.background{
    position: fixed;
  height: 100%;
  width: 100%;
  background-color: #7F7FD5;
}
.game {
    width: 50vw;

    border-radius: 0 0 15px 15px !important;
}

.chat {
    margin-top: auto;
    margin-bottom: auto;
}

.card {
    height: 500px;
    border-radius: 0 0 15px 15px !important;
    background: linear-gradient(to bottom, #4b4b7e, #222238);
}

.contacts_body {
    padding: 0.75rem 0 !important;
    overflow-y: auto;
    white-space: nowrap;
}

.msg_card_body {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #888 transparent;
}

.msg_card_body::-webkit-scrollbar {
    width: 6px;
}

.msg_card_body::-webkit-scrollbar-track {
    background: transparent;
}

.msg_card_body::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

.msg_card_body::-webkit-scrollbar-thumb:hover {
    background: #555;
}

.card-header {
    border-radius: 15px 15px 0 0 !important;
    border-bottom: 0 !important;
}

.card-footer {
    border-radius: 0 0 15px 15px !important;
    border-top: 0 !important;
}

.container {
    align-content: center;
}

.search {
    border-radius: 15px 0 0 15px !important;
    background-color: rgba(0, 0, 0, 0.3) !important;
    border: 0 !important;
    color: white !important;
}

.search:focus {
    box-shadow: none !important;
    outline: 0px !important;
}

.type_msg {
    background-color: rgba(0, 0, 0, 0.3) !important;
    border: 0 !important;
    color: white !important;
    height: 60px !important;
    overflow-y: auto;
}

.type_msg:focus {
    box-shadow: none !important;
    outline: 0px !important;
}

.attach_btn {
    border-radius: 15px 0 0 15px !important;
    background-color: rgba(0, 0, 0, 0.3) !important;
    border: 0 !important;
    color: white !important;
    cursor: pointer;
}

.send_btn {
    border-radius: 0 15px 15px 0 !important;
    background-color: rgba(0, 0, 0, 0.3) !important;
    border: 0 !important;
    color: white !important;
    cursor: pointer;
}

.search_btn {
    border-radius: 0 15px 15px 0 !important;
    background-color: rgba(0, 0, 0, 0.3) !important;
    border: 0 !important;
    color: white !important;
    cursor: pointer;
}

.contacts {
    list-style: none;
    padding: 0;
}

.contacts li {
    width: 100% !important;
    padding: 5px 10px;
    margin-bottom: 15px !important;
}

.active {
    background-color: rgba(0, 0, 0, 0.3);
}

.user_img {
    height: 70px;
    width: 70px;
    border: 1.5px solid #f5f6fa;

}

.user_img_msg {
    height: 40px;
    width: 40px;
    border: 1.5px solid #f5f6fa;

}

.img_cont {
    position: relative;
    height: 70px;
    width: 70px;
}

.img_cont_msg {
    height: 40px;
    width: 40px;
}

.online_icon {
    position: absolute;
    height: 15px;
    width: 15px;
    background-color: #4cd137;
    border-radius: 50%;
    bottom: 0.2em;
    right: 0.4em;
    border: 1.5px solid white;
}

.offline {
    background-color: #c23616 !important;
}

.user_info {
    margin-top: auto;
    margin-bottom: auto;
    margin-left: 15px;
}

.user_info span {
    font-size: 20px;
    color: white;
}

.user_info p {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
}

.video_cam {
    margin-left: 50px;
    margin-top: 5px;
}

.video_cam span {
    color: white;
    font-size: 20px;
    cursor: pointer;
    margin-right: 20px;
}

.msg_cotainer {
    margin-top: auto;
    margin-bottom: auto;
    margin-left: 10px;
    border-radius: 25px;
    background-color: #82ccdd00;
    padding: 10px;
    position: relative;
    border: 2px solid #82ccdd;
    color: #82ccdd;
}

.msg_cotainer_send {
    margin-top: auto;
    margin-bottom: auto;
    margin-right: 10px;
    border-radius: 25px;
    background-color: #78e08f00;
    padding: 10px;
    position: relative;
    border: 2px solid #78e08f;
    color: #78e08f;
}

.msg_time {
    position: absolute;
    left: 0;
    bottom: -15px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 10px;
}

.msg_time_send {
    position: absolute;
    right: 0;
    bottom: -15px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 10px;
}

.msg_head {
    position: relative;
}

#action_menu_btn {
    position: absolute;
    right: 10px;
    top: 10px;
    color: white;
    cursor: pointer;
    font-size: 20px;
}

.action_menu {
    z-index: 1;
    position: absolute;
    padding: 15px 0;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border-radius: 15px;
    top: 30px;
    right: 15px;
    display: none;
}

.action_menu ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.action_menu ul li {
    width: 100%;
    padding: 10px 15px;
    margin-bottom: 5px;
}

.action_menu ul li i {
    padding-right: 10px;

}

.action_menu ul li:hover {
    cursor: pointer;
    background-color: rgba(0, 0, 0, 0.2);
}

@media(max-width: 576px) {
    .contacts_card {
        margin-bottom: 15px !important;
    }
}
</style>