using System.ComponentModel.DataAnnotations;

namespace JustGoUp.Server.Models
{
    public class Post : BaseEntity
    {
        [Required]
        [StringLength(2000)]
        public string Content { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        public int? ClimbingRouteId { get; set; }
        public virtual ClimbingRoute? ClimbingRoute { get; set; }

        public int? AscentLogId { get; set; }
        public virtual AscentLog? AscentLog { get; set; }

        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;
    }
}
