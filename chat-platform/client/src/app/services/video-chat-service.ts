import { inject, Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { AuthService } from './auth-service';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VideoChatService {
  private hubUrl = `${environment.apiUrl}/hubs/video`;
  //private hubUrl = `http://localhost:5000/hubs/video`;
  public hubconnection!: HubConnection;
  public offerReceived = new BehaviorSubject<{senderId: string, offer: RTCSessionDescriptionInit} | null>(null);
  public awnserReceived = new BehaviorSubject<{senderId: string, answer: RTCSessionDescription} | null>(null);
  public iceReceivedCandidate = new BehaviorSubject<{senderId: string, candidate: RTCIceCandidate} | null>(null);
  public incomingCall = false;
  public isCallActive = false;
  public remoteUserId = '';
  public peerConnection!:RTCPeerConnection;

  private authService = inject(AuthService);
  startConnection()
  {
    this.hubconnection = new HubConnectionBuilder()
    .withUrl(this.hubUrl, {
      accessTokenFactory: () => this.authService.getAcessToken!
    })
    .withAutomaticReconnect()
    .build();

    this.hubconnection.start().catch((err)=>console.log('Erro enquanto iniciava a conexão'+ err));

    this.hubconnection.on("ReceiveOffer",(senderId, offer)=>{
      this.offerReceived.next({senderId, offer:JSON.parse(offer)});
    })

    this.hubconnection.on("ReceiveAnswer",(senderId, answer)=> {
      this.awnserReceived.next({senderId, answer:JSON.parse(answer)});
    });

    this.hubconnection.on("ReceiveIceCandidate",(senderId, candidate)=>{
      this.iceReceivedCandidate.next({senderId, candidate:JSON.parse(candidate)});
    });
  }

  sendOffer(receiverId: string, offer: RTCSessionDescriptionInit){
    this.hubconnection.invoke("SendOffer", receiverId, JSON.stringify(offer));
  }

  sendAwnser(receiverId: string, answer: RTCSessionDescriptionInit){
    this.hubconnection.invoke("SendAnswer", receiverId, JSON.stringify(answer));
  }

  sendIceCandidate(receiverId: string, candidate: RTCIceCandidate){
    this.hubconnection.invoke("SendIceCandidate", receiverId, JSON.stringify(candidate));
  }

  sendEndCall(receiverId: string){
    this.hubconnection.invoke("EndCall", receiverId);
  }
}
