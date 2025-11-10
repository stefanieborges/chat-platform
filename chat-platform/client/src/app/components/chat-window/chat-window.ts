import { Component, inject } from '@angular/core';
import { ChatService } from '../../services/chat-service';
import { TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ChatBox } from '../chat-box/chat-box';
import { VideoChatService } from '../../services/video-chat-service';
import { MatDialog } from '@angular/material/dialog';
import { VideoChat } from '../../video-chat/video-chat';

@Component({
  selector: 'app-chat-window',
  imports: [TitleCasePipe, MatIconModule, FormsModule, ChatBox],
  templateUrl: './chat-window.html',
  styles: ``
})
export class ChatWindow {
  chatService = inject(ChatService);
  message: string = '';
  signalRService = inject(VideoChatService);
  dialog = inject(MatDialog);
  sendMessage() {
    if(!this.message) return;
    this.chatService.sendMessage(this.message);
    this.message = '';
  }

  displayDialog(receiverId:string) {
    this.signalRService.remoteUserId = receiverId;
    this.dialog.open(VideoChat,
    {
      width: "400px",
      height: "600px",
      disableClose: true,
      autoFocus: false
    });
  }
}
