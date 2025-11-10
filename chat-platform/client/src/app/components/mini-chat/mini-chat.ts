// mini-chat.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-mini-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Botão Flutuante -->
    <button 
      *ngIf="!isOpen"
      (click)="toggleChat()"
      class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-50">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
      </svg>
      <span *ngIf="unreadCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {{unreadCount}}
      </span>
    </button>

    <!-- Mini Chat Window -->
    <div 
      *ngIf="isOpen"
      class="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 animate-slide-up">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold">Assistente IA</h3>
            <p class="text-xs text-blue-100">Online</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button 
            (click)="minimizeChat()"
            class="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
            </svg>
          </button>
          <button 
            (click)="closeChat()"
            class="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div #messagesContainer class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <div *ngIf="messages.length === 0" class="text-center text-gray-500 mt-8">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <p class="font-medium">Como posso ajudar?</p>
          <p class="text-sm mt-1">Digite sua pergunta abaixo</p>
        </div>

        <div *ngFor="let msg of messages" 
             [class]="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
          <div [class]="msg.role === 'user' 
            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]' 
            : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] shadow-sm'">
            <p class="text-sm whitespace-pre-wrap">{{msg.content}}</p>
            <span class="text-xs opacity-70 mt-1 block">
              {{msg.timestamp | date:'HH:mm'}}
            </span>
          </div>
        </div>

        <div *ngIf="isLoading" class="flex justify-start">
          <div class="bg-white text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <div class="flex gap-1">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
        <form (submit)="sendMessage($event)" class="flex gap-2">
          <input
            [(ngModel)]="userInput"
            name="message"
            type="text"
            placeholder="Digite sua mensagem..."
            [disabled]="isLoading"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            autocomplete="off">
          <button
            type="submit"
            [disabled]="!userInput.trim() || isLoading"
            class="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
  `]
})
export class MiniChat {
  isOpen = false;
  isLoading = false;
  userInput = '';
  messages: Message[] = [];
  unreadCount = 0;

  private apiUrl = `${environment.apiUrl}/api/account/chatOpenai`;
  //private apiUrl = `http://localhost:5000/api/account/chatOpenai`;
  
  constructor(private http: HttpClient) {}

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
    }
  }

  minimizeChat() {
    this.isOpen = false;
  }

  closeChat() {
    this.isOpen = false;
  }

  async sendMessage(event: Event) {
    event.preventDefault();
    
    if (!this.userInput.trim() || this.isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: this.userInput,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    const question = this.userInput;
    this.userInput = '';
    this.isLoading = true;

    try {
  
      // Configuração dos headers
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      // Usar firstValueFrom ao invés de toPromise()
      const response = await firstValueFrom(
        this.http.post<any>(this.apiUrl, { message: question }, { headers })
      );

      // Extrai o texto da resposta da OpenAI
      let replyText = 'Sem resposta';
      
      // Tenta extrair do formato GPT-5 (output array)
      if (response.output && Array.isArray(response.output)) {
        
        const messageOutput = response.output.find((item: any) => item.type === 'message');
        
        if (messageOutput?.content?.[0]?.text) {
          replyText = messageOutput.content[0].text;
        }
      } 
      // Fallback: tenta extrair diretamente se vier em outro formato
      else if (response.message) {
        replyText = response.message;
      }
      else if (response.text) {
        replyText = response.text;
      }
      else if (typeof response === 'string') {
        replyText = response;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: replyText,
        timestamp: new Date()
      };

      this.messages.push(assistantMessage);
      
      if (!this.isOpen) {
        this.unreadCount++;
      }

    } catch (error: any) {
      let errorMsg = 'Erro ao processar requisição';
      
      if (error.status === 0) {
        errorMsg = 'Não foi possível conectar ao servidor. Verifique se a API está rodando.';
      } else if (error.status === 404) {
        errorMsg = 'Endpoint não encontrado. Verifique a URL da API.';
      } else if (error.error?.message) {
        errorMsg = error.error.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ ${errorMsg}`,
        timestamp: new Date()
      };
      
      this.messages.push(errorMessage);
    } finally {
      this.isLoading = false;
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.overflow-y-auto');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}