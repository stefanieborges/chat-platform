import { Component, inject, OnInit } from '@angular/core';
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { ChatService } from '../../services/chat-service';
import { User } from '../../models/User';
import { TypingIndicate } from '../typing-indicate/typing-indicate';

@Component({
  selector: 'app-chat-sidebar',
  imports: [MatMenuModule, MatIconModule, TitleCasePipe, TypingIndicate],
  templateUrl: './chat-sidebar.html',
  styles: ``
})
export class ChatSidebar implements OnInit{
  authService = inject(AuthService);
  chatService = inject(ChatService)
  router = inject(Router);

  logout() {
    this.chatService.disconnectConnection();
    this.authService.logout();
    this.router.navigate(['login']);
  }

   ngOnInit(): void {
    this.chatService.startConnection(this.authService.getAcessToken!);
  }

  
  openChatWindow(user: User) {
    this.chatService.selectChat(user);
  }
}
