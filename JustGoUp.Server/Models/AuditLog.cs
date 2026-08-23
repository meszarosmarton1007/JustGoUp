using System.ComponentModel.DataAnnotations;

namespace JustGoUp.Server.Models
{
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public string? UserId { get; set; }
        public string? UserEmail { get; set; }

        [Required]
        [StringLength(100)]
        public string Action { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string AffectedTable { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string AffectedRecordId { get; set; } = string.Empty;

        [Required]
        [StringLength(45)]
        public string IpAddress { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string UserAgent { get; set; } = string.Empty;
    }
}
