import { inject, Injectable, signal} from '@angular/core';
import { AuthService } from './auth-service';
import { User } from '../models/User';
import {HubConnection, HubConnectionBuilder, HubConnectionState}  from '@microsoft/signalr'
import { Message } from '../models/message';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private authService = inject(AuthService);
  private hubUrl = `${environment.apiUrl}/hubs/chat`;
  //private hubUrl = `http://localhost:5000/hubs/chat`;
  onlineUsers = signal<User[]>([]);
  currentOpenedChat = signal<User | null>(null) ;
  chatMessages = signal<Message[]>([])
  isLoading = signal<boolean>(true);
  private hubConnection?:HubConnection;
  hasMoreMessages = signal<boolean>(true);

  startConnection(token:string, senderId?:string){
    this.hubConnection = new HubConnectionBuilder().withUrl(
      `${this.hubUrl}?senderId=${senderId || ''}`, {
        accessTokenFactory:()=>token
      }
    ).withAutomaticReconnect()
    .build();

    this.hubConnection.start()
    .then(()=>{
      
    }).catch((error)=>{
      console.log('Erro Conexão ou Login', error)
    });

    this.hubConnection!.on('OnlineUsers', (user:User[])=>{
      this.onlineUsers.update(()=>
        user.filter(user=>user.userName !== this.authService.currenLoggedtUser!.userName)
      )
    })

      this.hubConnection!.on('TypingNotification', (senderUserName) => {
    this.onlineUsers.update((users) =>
      users.map(user => {
        if (user.userName === senderUserName) {
          user.isTyping = true;
        }
        return user;
      })
    );

    setTimeout(() => {
      this.onlineUsers.update((users) =>
        users.map(user => {
          if (user.userName === senderUserName) {
            user.isTyping = false;
          }
          return user;
        })
      );
    }, 2000);
  });


   



this.hubConnection!.on('ReceivedMessagesList', (messages: Message[]) => {
 
  
  if (messages && messages.length > 0) {
    if (this.currentPage() === 1) {
     
      this.chatMessages.set(messages.reverse());
    } else {
     
      this.chatMessages.update(current => [...messages.reverse(), ...current]);
    }
    this.hasMoreMessages.set(true); // ✅ Ainda há mensagens
  } else {
    
    this.hasMoreMessages.set(false); // ✅ Não há mais mensagens
  }
  
 
  this.isLoading.set(false);
})


    this.hubConnection!.on('ReceiveNewMessage', (message: Message) => {
 
  
  const currentChat = this.currentOpenedChat();
  
  // ✅ Só adiciona se for do chat atual OU se for uma mensagem recebida de quem está no chat
  if (currentChat && 
      (message.senderId === currentChat.id || message.receiverId === currentChat.id)) {
    document.title = "Nova Mensagem!";
    this.chatMessages.update((messages) => [...messages, message]);
  } else {
   
  }
})

this.hubConnection!.on('MessageSent', (message: Message) => {

})
  }

  disconnectConnection(){
    if(this.hubConnection?.state === HubConnectionState.Connected){
      this.hubConnection.stop().catch((erro) => console.log(erro));
    }
  }

  status(userName: string) : string {
    const currentChatUser = this.currentOpenedChat();
    if(!currentChatUser){
      return 'offline';
    }

    const onlineUser = this.onlineUsers().find(
      (user)=>user.userName == userName
    )

    return onlineUser?.isTyping ? 'Digitando...':this.isUserOnline();
  }

  isUserOnline():string {
    let onlineUser = this.onlineUsers().find(user=>user.userName === this.currentOpenedChat()?.userName);
    return onlineUser?.isOnline ? 'online' : this.currentOpenedChat()!.userName;
  }

 loadMessages(pageNumber: number) {
 
  this.hubConnection?.invoke('LoadMessages', this.currentOpenedChat()!.id, pageNumber)
    .then(() => {
      console.log('LoadMessages invocado com sucesso');
    })
    .catch((error) => {
      console.error('Erro ao invocar LoadMessages:', error);
      this.isLoading.set(false);
    });
}

  sendMessage(message: string) {

  
  const tempMessage = {
    content: message,
    senderId: this.authService.currenLoggedtUser!.id,
    receiverId: this.currentOpenedChat()!.id,
    createDate: new Date().toISOString(),
    isRead: false,
    id: 0
  };
  
  this.chatMessages.update((messages) => [...messages, tempMessage]);
  
  // 🎯 USE PASCALCASE (primeira letra maiúscula)
  this.hubConnection?.invoke('SendMessage', {
    ReceiveId: this.currentOpenedChat()?.id,  // ✅ Maiúsculo
    Content: message                           // ✅ Maiúsculo
  })
    .then(() => {
     
    })
    .catch((error) => {
      this.chatMessages.update((messages) => 
        messages.filter(m => m.id !== 0)
      );
    });
}

private currentPage = signal<number>(1);

selectChat(user: User) {
  this.chatMessages.set([]);
  this.currentOpenedChat.set(user);
  this.currentPage.set(1);
  this.hasMoreMessages.set(true); // Reset ao trocar de chat
  this.isLoading.set(true);
  this.loadMessages(1);
}
// Novo método para carregar mais mensagens
loadMoreMessages() {
  const nextPage = this.currentPage() + 1;
  this.currentPage.set(nextPage);
  this.isLoading.set(true);
  this.loadMessages(nextPage);
}

  notifyTyping(){
    this.hubConnection?.invoke('NotifyTyping', this.currentOpenedChat()!.userName)
    .then((x)=>{
      console.log('Notificação de digitação enviada', x);
    })     
    .catch((erro)=>{
      console.log('Erro ao notificar digitação', erro);  
    }); 
  }
}
