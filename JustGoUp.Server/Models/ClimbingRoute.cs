using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JustGoUp.Server.Models
{
    public class ClimbingRoute : BaseEntity
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Grade { get; set; } = string.Empty;

        [Required]
        public string ImageUrl { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "jsonb")] //PostgreSQL specific, for drawings
        public string CanvasDataJson { get; set; } = "{}";

        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        [Required]
        public int ClimbingWallId { get; set; }
        public virtual ClimbingWall ClimbingWall { get; set; } = null!;

        public virtual ICollection<AscentLog> Ascents { get; set; } = new List<AscentLog>();
        public virtual ICollection<Post> SharedInPosts { get; set; } = new List<Post>();
        public virtual ICollection<RouteComment> Comments { get; set; } = new List<RouteComment>();


    }
}
