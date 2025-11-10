using API.Models;

public class Message
{
    public int Id { get; set; }
    
    // 🎯 CERTIFIQUE-SE QUE ESSAS PROPRIEDADES EXISTEM
    public string SenderId { get; set; } = string.Empty;
    public string ReceiveId { get; set; } = string.Empty;
    
    public string Content { get; set; } = string.Empty;
    public DateTime CreateDate { get; set; }
    public bool IsRead { get; set; }
    
    // Propriedades de navegação
    public AppUser? Sender { get; set; }
    public AppUser? Receiver { get; set; }
}