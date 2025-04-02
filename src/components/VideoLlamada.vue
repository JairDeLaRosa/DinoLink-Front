<template>
    <div class="container">
      <div class="video-container">
        <video ref="localVideo" autoplay muted class="video"></video>
        <video ref="remoteVideo" autoplay class="video"></video>
      </div>
      <div class="controls">
        <button @click="startCall" :disabled="!partnerId || callStarted">
          {{ callStarted ? 'Llamada en curso' : 'Iniciar Llamada' }}
        </button>
        <button @click="endCall" :disabled="!callStarted">Terminar Llamada</button>
      </div>
      <p v-if="statusMessage">{{ statusMessage }}</p>
      <div v-if="connectionStats" class="stats">
        <p>Tipo de conexión: {{ connectionStats.connectionType }}</p>
        <p>Protocolo: {{ connectionStats.protocol }}</p>
      </div>
    </div>
  </template>
  
  <script>
  import { io } from 'socket.io-client';
  
  export default {
    data() {
      return {
        socket: null,
        peerConnection: null,
        localStream: null,
        partnerId: null,
        statusMessage: 'Conectando...',
        callStarted: false,
        makingOffer: false,
        connectionStats: null,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3,
        iceCandidates: [],
        isSettingRemoteDescription: false
      };
    },
    mounted() {
      this.initSocket();
      this.initMedia();
    },
    beforeUnmount() {
      this.endCall();
      if (this.socket) this.socket.disconnect();
    },
    methods: {
      async initMedia() {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
          });
          this.$refs.localVideo.srcObject = this.localStream;
        } catch (error) {
          console.error('Error al acceder a dispositivos:', error);
          this.statusMessage = 'Error al acceder a cámara/micrófono';
        }
      },
      
      initSocket() {
        this.socket = io('https://1hl3t7c4-3000.use2.devtunnels.ms');
        
        this.socket.on('waiting', () => {
          this.statusMessage = 'Buscando otro usuario...';
        });
        
        this.socket.on('paired', ({ partnerId }) => {
          this.partnerId = partnerId;
          this.statusMessage = `Conectado con usuario ${partnerId}`;
        });
        
        this.socket.on('rtc-signal', this.handleSignal);
        
        this.socket.on('partner-left', () => {
          this.statusMessage = 'Tu pareja ha abandonado la llamada';
          this.endCall();
        });
      },
      
      async handleSignal({ from, signal }) {
        try {
          if (!this.peerConnection) {
            await this.initPeerConnection();
          }
          
          if (signal.type === 'offer') {
            await this.handleOffer(from, signal);
          } 
          else if (signal.type === 'answer') {
            await this.handleAnswer(signal);
          } 
          else if (signal.candidate) {
            await this.handleIceCandidate(signal);
          }
        } catch (error) {
          console.error('Error procesando señal:', error);
          this.statusMessage = 'Error en conexión, reintentando...';
          this.reconnect();
        }
      },
  
      async handleOffer(from, offer) {
        this.isSettingRemoteDescription = true;
        
        try {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          
          // Procesar candidatos ICE acumulados
          await this.processPendingIceCandidates();
          
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          this.sendSignal({ to: from, signal: answer });
        } finally {
          this.isSettingRemoteDescription = false;
        }
      },
  
      async handleAnswer(answer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        await this.processPendingIceCandidates();
      },
  
      async handleIceCandidate(candidate) {
        if (this.isSettingRemoteDescription) {
          // Acumular candidatos si estamos procesando una oferta/respuesta
          this.iceCandidates.push(candidate);
        } else {
          // Procesar inmediatamente si no hay operación en curso
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            if (!this.shouldIgnoreCandidateError(e)) {
              console.warn('Error añadiendo ICE candidate:', e);
            }
          }
        }
      },
  
      async processPendingIceCandidates() {
        while (this.iceCandidates.length > 0) {
          const candidate = this.iceCandidates.shift();
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Error añadiendo ICE candidate pendiente:', e);
          }
        }
      },
      
      async initPeerConnection() {
        const config = {
          iceServers: [
            // Servidores STUN redundantes y diversos
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:stun.voipbuster.com:3478' },
            { urls: 'stun:stun.services.mozilla.com:3478' },
            { urls: 'stun:stun.voipstunt.com:3478' },
            { urls: 'stun:stun.ekiga.net:3478' },
            { urls: 'stun:stun.ideasip.com:3478' },
            { urls: 'stun:stun.nextcloud.com:443' },
            { urls: 'stun:stun.12connect.com:3478' },
            { urls: 'stun:stun.12voip.com:3478' },
            { urls: 'stun:stun.1und1.de:3478' },
            { urls: 'stun:stun.2talk.co.nz:3478' },
            { urls: 'stun:stun.2talk.com:3478' },
            { urls: 'stun:stun.3clogic.com:3478' },
            { urls: 'stun:stun.3cx.com:3478' },
            { urls: 'stun:stun.a-mm.tv:3478' },
            { urls: 'stun:stun.aa.net.uk:3478' },
          ],
  
          // Configuraciones críticas para mejorar la conectividad
          // Ajustes críticos
      iceTransportPolicy: "all",  // P2P primero, luego TURN
      iceCandidatePoolSize: 6,    // Balance entre velocidad/cobertura
      iceTcpCandidatePolicy: "enabled",  // Habilita TCP explícitamente
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
      
          // Timeouts más agresivos para detectar fallos rápido
          iceCheckingTimeout: 5000,
      
          // Configuración de codecs preferidos para reducir complejidad
          sdpSemantics: 'unified-plan',
          codecPreferences: {
            video: ['VP8', 'H264'], // VP8 es más tolerante con paquetes perdidos
            audio: ['opus']         // Opus es robusto y flexible
          }
      };
    
    this.peerConnection = new RTCPeerConnection(config);
  
    // Añadir stream local
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });
  
    // Manejar stream remoto
    this.peerConnection.ontrack = (event) => {
    if (!this.callStarted) {
      this.callStarted = true;
      this.statusMessage = 'Llamada en progreso';
    }
          
          const remoteStream = event.streams[0];
          this.$refs.remoteVideo.srcObject = remoteStream;
          this.$refs.remoteVideo.play().catch(e => {
            console.error('Error al reproducir:', e);
            this.$refs.remoteVideo.muted = true;
            this.$refs.remoteVideo.play().catch(console.error);
          });
        };
        
        // Manejar ICE candidates
        this.peerConnection.onicecandidate = ({ candidate }) => {
          if (candidate) {
            this.sendSignal({ to: this.partnerId, signal: candidate });
          }
        };
        
        // Manejar cambios de estado
        this.peerConnection.oniceconnectionstatechange = () => {
    const state = this.peerConnection.iceConnectionState;
    console.log('ICE connection state:', state);
    
    switch(state) {
      case 'connected':
        this.callStarted = true;
        this.statusMessage = 'Llamada en progreso';
        break;
      case 'disconnected':
        this.statusMessage = 'Conexión inestable, intentando recuperar...';
        setTimeout(() => {
          if (this.peerConnection.iceConnectionState === 'disconnected') {
            this.reconnect();
          }
        }, 2000);
        break;
      case 'failed':
        this.statusMessage = 'Conexión fallida, reconectando...';
        this.reconnect();
        break;
    }
  };
      },
      
      async startCall() {
        if (!this.peerConnection) {
          await this.initPeerConnection();
        }
        
        try {
          this.makingOffer = true;
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          this.sendSignal({ to: this.partnerId, signal: offer });
          
          // Establecer timeout para verificar si la llamada se estableció
          setTimeout(() => {
            if (!this.callStarted) {
              this.statusMessage = 'No se pudo establecer la llamada, reintentando...';
              this.reconnect();
            }
          }, 10000); // 10 segundos de timeout
        } catch (error) {
          console.error('Error iniciando llamada:', error);
          this.statusMessage = 'Error al iniciar llamada';
        } finally {
          this.makingOffer = false;
        }
      },
      
      async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.statusMessage = 'No se pudo establecer la conexión';
          this.endCall();
          return;
        }
        
        this.reconnectAttempts++;
        this.statusMessage = `Reconectando (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`;
        
        try {
          this.endCall();
          await new Promise(resolve => setTimeout(resolve, 1000 * this.reconnectAttempts));
          await this.initPeerConnection();
          this.startCall();
        } catch (error) {
          console.error('Error en reconexión:', error);
        }
      },
      
      sendSignal(data) {
        if (this.socket && this.partnerId) {
          this.socket.emit('rtc-signal', data);
        }
      },
      
      endCall() {
        if (this.peerConnection) {
          this.peerConnection.getSenders().forEach(sender => {
            if (sender.track) sender.track.stop();
          });
          this.peerConnection.close();
          this.peerConnection = null;
        }
        
        if (this.$refs.remoteVideo.srcObject) {
          this.$refs.remoteVideo.srcObject.getTracks().forEach(track => track.stop());
          this.$refs.remoteVideo.srcObject = null;
        }
        
        this.callStarted = false;
        this.partnerId = null;
        this.connectionStats = null;
        this.reconnectAttempts = 0;
        this.iceCandidates = [];
      }
    }
  };
  </script>
  
  <style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
  }
  .video-container {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
  .video {
    width: 50%;
    max-height: 400px;
    background: #000;
    border-radius: 8px;
  }
  .controls {
    margin-bottom: 20px;
  }
  button {
    padding: 10px 20px;
    margin: 0 10px;
    cursor: pointer;
  }
  .stats {
    margin-top: 10px;
    font-size: 14px;
    color: #666;
  }
  </style>
  