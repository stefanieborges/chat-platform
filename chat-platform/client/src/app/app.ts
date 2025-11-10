import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VideoChatService } from './services/video-chat-service';
import { AuthService } from './services/auth-service';
import { MatDialog } from '@angular/material/dialog';
import { VideoChat } from './video-chat/video-chat';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('client');

  private signalRService = inject(VideoChatService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog)

  ngOnInit(): void{
    if(!this.authService.getAcessToken) return;
    this.signalRService.startConnection();
    this.startOfferReceive();
  }

  startOfferReceive(){
    this.signalRService.offerReceived.subscribe(async (data) => {
      if(data){
        this.dialog.open(VideoChat,{
          width: "400px",
          height: "600px",
          disableClose: false
        });
        this.signalRService.remoteUserId = data.senderId;
        this.signalRService.incomingCall = true; 
      }
    })
  }
}
