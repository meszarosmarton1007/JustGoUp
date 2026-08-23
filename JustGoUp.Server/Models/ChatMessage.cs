using System.ComponentModel.DataAnnotations;

namespace JustGoUp.Server.Models
{
    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SenderId { get; set; }
        public virtual User Sender { get; set; } = null!;

        [Required]
        public int ReceiverId { get; set; }
        public virtual User Receiver { get; set; } = null!;

        [Required]
        [StringLength(1000)]
        public string MessageText { get; set; } = string.Empty;

        [Required]
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        [Required]
        public bool IsRead { get; set; } = false;

        public DateTime? ReadAt { get; set; }

        [Required]
        public bool DeletedBySender { get; set; } = false;

        [Required]
        public bool DeletedByReceiver { get; set; } = false;
    }
}
