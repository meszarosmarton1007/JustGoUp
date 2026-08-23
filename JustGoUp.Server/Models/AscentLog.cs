using System.ComponentModel.DataAnnotations;

namespace JustGoUp.Server.Models
{
    public class AscentLog : BaseEntity
    {
        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        [Required]
        public int ClimbingRouteId { get; set; }
        public virtual ClimbingRoute ClimbingRoute { get; set; } = null!;

        [Required]
        public AccentStyle Style { get; set; }

        [Required]
        public DateTime DateClimbed { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? Notes { get; set; }

        public int? AttemptsCount { get; set; }

        public virtual ICollection<Post> SharedInPosts { get; set; } = new List<Post>();
    }
}
