import { Component, effect, inject } from '@angular/core';
import { ChatService } from '../../services/chat-service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth-service';
import { DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-chat-box',
  imports: [MatProgressSpinnerModule, DatePipe, MatIcon],
  templateUrl: './chat-box.html',
  styles: `
    .chat-box {
      scroll-behavior: smooth;
      overflow: hidden;
      padding: 10px;
      display: flex;
      flex-direction: column;
      background-color: #f5f5f5;
      height: 81vh;
      overflow-y: scroll
    }

    .chat-box::-webkit-scrollbar {
      width: 5px;
      transition:width 0.3s;
    }

    .chat-box:hover::-webkit-scrollbar {
      width: 5px;
    }

    .chat-box::-webkit-scrollbar-track {
      background-color: transparent;
      border-radius: 10px;
    }

    .chat-box:hover::-webkit-scrollbar-thumb {
      background: gray;
      border-radius: 10px;
    }

    .chat-box::-webkit-scrollbar-thumb:hover {
      background: #555;
    }

    .chat-icon{
      width:40px;
      height: 40px;
      font-size: 48px;
    }

    `
})
export class ChatBox {
 chatService = inject(ChatService);
  authService = inject(AuthService);
   
  loadMoreMessages(){
    this.chatService.loadMoreMessages(); 
  }
}
