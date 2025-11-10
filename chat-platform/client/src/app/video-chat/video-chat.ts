import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { VideoChatService } from '../services/video-chat-service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-video-chat',
  imports: [MatIconModule],
  template: `
    <div class="relative h-full w-full">
      <video class="w-32 absolute right-5 top-4 h-52 object-cover border-red-500 border-2 rounded-lg" #localVideo autoplay playsInline></video>
      <video class="w-full h-full object-cover bg-slate-800" #remoteVideo autoplay playsInline></video>
      <div class="absolute bottom-10 left-0 right-0 z-50 flex justify-center space-x-3 p-4">
        @if(signalRService.incomingCall){  
          <button (click)="acceptCall()" class="bg-green-500 flex items-center gap-2 hover:bg-gray-700 shadow-xl text-white font-bold py-2 px-4 rounded-full">
            <mat-icon>call</mat-icon>
            Aceitar
          </button>

          <button (click)="declineCall()" class="bg-red-500 flex items-center gap-2 hover:bg-red-700 shadow-xl text-white font-bold py-2 px-4 rounded-full">
            <mat-icon>call_end</mat-icon>
            Rejeitar
          </button>
        }
        @if(!signalRService.incomingCall && !this.signalRService.isCallActive){
          <button (click)="startCall()" class="bg-green-500 flex items-center gap-2 hover:bg-gray-700 shadow-xl text-white font-bold py-2 px-4 rounded-full">
            <mat-icon>call</mat-icon>
            Começar Chamada
          </button>
        }

        @if(!signalRService.incomingCall && this.signalRService.isCallActive){
          <button (click)="endCall()" class="bg-red-500 flex items-center gap-2 hover:bg-red-700 shadow-xl text-white font-bold py-2 px-4 rounded-full">
            <mat-icon>call_end</mat-icon>
            Encerrar Chamada
          </button>
        }
      </div>
    </div>
  `,
  styles: ``
})
export class VideoChat {
  @ViewChild("localVideo") localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild("remoteVideo") remoteVideo!: ElementRef<HTMLVideoElement>;
  
  private peerConnection!: RTCPeerConnection;
  private pendingIceCandidates: RTCIceCandidate[] = [];
  signalRService = inject(VideoChatService); 
  private dialogRef: MatDialogRef<VideoChat> = inject(MatDialogRef);

  ngOnInit(): void {
    this.setupPeerConnection();
    this.startLocalVideo();
    this.signalRService.startConnection();
    this.setupSignalListeners();
  }

  setupSignalListeners() {
    this.signalRService.hubconnection.on("CallEnded", () => {
      this.endCall();
    });

    // Listener para ofertas recebidas
    this.signalRService.offerReceived.subscribe(async (data) => {
      if (data && !this.signalRService.isCallActive) {
        this.signalRService.incomingCall = true;
        this.signalRService.remoteUserId = data.senderId;
      }
    });

    // Listener para respostas recebidas
    this.signalRService.awnserReceived.subscribe(async (data) => {
      if (data && this.peerConnection.signalingState !== 'stable') {
        try {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          await this.processPendingIceCandidates();
        } catch (error) {
          console.error('Erro ao definir remote description:', error);
        }
      }
    });

    // Listener para candidatos ICE
    this.signalRService.iceReceivedCandidate.subscribe(async (data) => {
      if (data) {
        await this.handleIceCandidate(data.candidate);
      }
    });  
  }

  async handleIceCandidate(candidate: RTCIceCandidate) {
    try {
      // Se remote description ainda não foi definida, armazena o candidato
      if (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
        this.pendingIceCandidates.push(candidate);
        console.log('Candidato ICE armazenado para processamento posterior');
      } else {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Candidato ICE adicionado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao processar candidato ICE:', error);
    }
  }

  async processPendingIceCandidates() {
    console.log(`Processando ${this.pendingIceCandidates.length} candidatos ICE pendentes`);
    for (const candidate of this.pendingIceCandidates) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Erro ao adicionar candidato ICE pendente:', error);
      }
    }
    this.pendingIceCandidates = [];
  }

  declineCall() {
    this.signalRService.sendEndCall(this.signalRService.remoteUserId);
    this.signalRService.incomingCall = false;
    this.signalRService.isCallActive = false;
    this.dialogRef.close();
  }

  async acceptCall() {
    try {
      this.signalRService.incomingCall = false;
      this.signalRService.isCallActive = true;

      let offerData = this.signalRService.offerReceived.getValue();
      if (offerData?.offer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerData.offer));
        
        // Processa candidatos ICE que chegaram antes
        await this.processPendingIceCandidates();

        let answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.signalRService.sendAwnser(this.signalRService.remoteUserId, answer);
      }
    } catch (error) {
      console.error('Erro ao aceitar chamada:', error);
    }
  }

  async startCall() {
    try {
      this.signalRService.isCallActive = true;
      let offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.signalRService.sendOffer(this.signalRService.remoteUserId, offer);
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error);
    }
  }

  setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalRService.sendIceCandidate(this.signalRService.remoteUserId, event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteVideo.nativeElement.srcObject = event.streams[0];
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
    };
  }

  async startLocalVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localVideo.nativeElement.srcObject = stream;

      stream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, stream);
      });
    } catch (error) {
      console.error('Erro ao acessar mídia local:', error);
    }
  }

  async endCall() {
    // Notifica o outro usuário ANTES de limpar
    if (this.signalRService.remoteUserId) {
      this.signalRService.sendEndCall(this.signalRService.remoteUserId);
    }

    // Limpa o stream local
    const stream = this.localVideo.nativeElement.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      this.localVideo.nativeElement.srcObject = null;
    }

    // Limpa o stream remoto
    if (this.remoteVideo.nativeElement.srcObject) {
      this.remoteVideo.nativeElement.srcObject = null;
    }

    // Fecha a conexão peer
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    // Reseta o estado
    this.pendingIceCandidates = [];
    this.signalRService.isCallActive = false;
    this.signalRService.incomingCall = false;
    this.signalRService.remoteUserId = '';

    // Recria a conexão para próxima chamada
    this.setupPeerConnection();

    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.endCall();
  }
}