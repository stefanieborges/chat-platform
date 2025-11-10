import { Component, inject } from '@angular/core';
import { ChatSidebar } from "../components/chat-sidebar/chat-sidebar";
import { ChatWindow } from "../components/chat-window/chat-window";
import { ChatRightSidebar } from "../components/chat-right-sidebar/chat-right-sidebar";
import { MiniChat } from "../components/mini-chat/mini-chat";
import { ChatService } from '../services/chat-service';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-chat',
  imports: [ChatSidebar, ChatWindow, ChatRightSidebar, MiniChat],
  templateUrl: './chat.html',
})
export class Chat {
  
}
