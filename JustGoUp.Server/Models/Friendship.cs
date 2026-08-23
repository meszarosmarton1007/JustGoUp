using System.ComponentModel.DataAnnotations;

namespace JustGoUp.Server.Models
{
    public class Friendship : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int RequestorId { get; set; }
        public virtual User Requestor { get; set; } = null!;

        [Required]
        public int ReceiverId { get; set; }
        public virtual User Receiver { get; set; } = null!;

        [Required]
        public FriendshipStatus Status { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ActionAt { get; set; }
    }
}
