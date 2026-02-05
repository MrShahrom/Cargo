using System.ComponentModel.DataAnnotations;

namespace Cargo.API.Entities;

public class Client
{
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string HumanId { get; set; } = string.Empty; // e.g., A00001
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;
    
    public string? ChatId { get; set; } // Telegram Chat ID
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
