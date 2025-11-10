using System;
using System.Collections.Concurrent;
using API.Data;
using API.DTOs;
using API.Extensions;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;

namespace API.Hubs;

[Authorize]
public class ChatHub(UserManager<AppUser> userManager, AppDbContext context) : Hub
{
    public static readonly ConcurrentDictionary<string, OnlineUsersDto> onlineUsers = new();

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var receiveId = httpContext?.Request.Query["senderId"].ToString();
        var userName = Context.User?.Identity?.Name!;
        var currentUser = await userManager.FindByNameAsync(userName);
        var connectionId = Context.ConnectionId;

        if (onlineUsers.ContainsKey(userName))
        {
            onlineUsers[userName].ConnectionId = connectionId;
        }
        else
        {
            var user = new OnlineUsersDto
            {
                ConnectionId = connectionId,
                UserName = userName,
                ProfileImage = currentUser!.ProfileImage,
                FullName = currentUser!.FullName,
            };

            onlineUsers.TryAdd(userName, user);

            await Clients.AllExcept(connectionId).SendAsync("Notify", currentUser);
        }

        if (!string.IsNullOrEmpty(receiveId))
        {
            await LoadMessages(receiveId);
        }

        await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());
    }

public async Task LoadMessages(string recipientId, int pageNumber = 1)
{
    int pageSize = 7;
    var userName = Context.User!.Identity!.Name;
    var currentUser = await userManager.FindByNameAsync(userName!);

    if (currentUser is null)
    {
        return;
    }

    // 🔍 VERIFICAÇÃO: Conte TODAS as mensagens entre esses dois usuários
    var totalMessages = await context.Messages.CountAsync(x =>
        (x.SenderId == currentUser.Id && x.ReceiveId == recipientId) ||
        (x.SenderId == recipientId && x.ReceiveId == currentUser.Id));
  

    // Busca as mensagens
    List<MessageResponseDto> messages = await context.Messages.Where(x =>
        (x.SenderId == currentUser.Id && x.ReceiveId == recipientId) ||
        (x.SenderId == recipientId && x.ReceiveId == currentUser.Id))
        .OrderByDescending(x => x.CreateDate)
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .Select(m => new MessageResponseDto
        {
            Id = m.Id,
            SenderId = m.SenderId,
            ReceiveId = m.ReceiveId,
            Content = m.Content,
            CreateDate = m.CreateDate,
        })
        .ToListAsync();
    
    // Marca como lidas
    foreach (var message in messages)
    {
        var msg = await context.Messages.FirstOrDefaultAsync(X => X.Id == message.Id);
        if (msg != null && msg.ReceiveId == currentUser.Id)
        {
            msg.IsRead = true;
        }
    }
    await context.SaveChangesAsync();
    
    await Clients.User(currentUser.Id).SendAsync("ReceivedMessagesList", messages);
}

   public async Task SendMessage(MessageRequestDto message)
    {
    var senderUserName = Context.User!.Identity!.Name;
    var sender = await userManager.FindByNameAsync(senderUserName!);
    var recipient = await userManager.FindByIdAsync(message.ReceiveId!);

    if (sender == null || recipient == null)
    {
        return;
    }

    var newMsg = new Message
    {
        SenderId = sender.Id,
        ReceiveId = recipient.Id,
        Content = message.Content,
        CreateDate = DateTime.UtcNow,
        IsRead = false
    };

    context.Messages.Add(newMsg);
    await context.SaveChangesAsync();

    var messageResponse = new MessageResponseDto
    {
        Id = newMsg.Id,
        SenderId = newMsg.SenderId,
        ReceiveId = newMsg.ReceiveId,
        Content = newMsg.Content,
        CreateDate = newMsg.CreateDate
    };
    await Clients.User(recipient.Id).SendAsync("ReceiveNewMessage", messageResponse);
    
    await Clients.User(sender.Id).SendAsync("MessageSent", messageResponse);
}

    private async Task<IEnumerable<OnlineUsersDto>> GetAllUsers()
    {
        var username = Context.User!.GetUserName();
        var onlineUsersSet = new HashSet<string>(onlineUsers.Keys);
        var users = await userManager.Users.Select(u => new OnlineUsersDto
        {
            Id = u.Id,
            UserName = u.UserName,
            FullName = u.FullName,
            ProfileImage = u.ProfileImage,
            IsOnline = onlineUsersSet.Contains(u.UserName!),
            UnreadCount = context.Messages.Count(m =>
    m.ReceiveId == username && // mensagens para MIM
    m.SenderId == u.Id &&      // enviadas por ELE
    !m.IsRead)
        }).OrderByDescending(u => u.IsOnline)
        .ToListAsync();

        return users;
    }

    public async Task NotifyTyping(string? recipientUser)
    {
        var senderUserName = Context.User!.Identity!.Name;
        if (senderUserName is null)
        {
            return;
        }

        var connectionId = onlineUsers.Values.FirstOrDefault(x => x.UserName == recipientUser)?.ConnectionId;
        if (connectionId != null)
        {
            await Clients.Client(connectionId).SendAsync("TypingNotification", senderUserName);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userName = Context.User?.Identity?.Name;

        if (!string.IsNullOrEmpty(userName))
        {

            onlineUsers.TryRemove(userName, out _);

            await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());


        }

        await base.OnDisconnectedAsync(exception);
    }
}
