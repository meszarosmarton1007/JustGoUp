using System.ComponentModel.DataAnnotations;

namespace JustGoUp.Server.Models
{
    public class ClimbingWall : BaseEntity
    {
        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string WallType { get; set; } = string.Empty;

        [Required]
        public string imageUrl { get; set; } = string.Empty;

        [Required]
        public int CreatedByUserId { get; set; }
        public virtual User CreatedByUser { get; set; } = null!;

        [Required]
        public int ClimbingGymId { get; set; }
        public virtual ClimbingGym ClimbingGym { get; set; } = null!;

        public virtual ICollection<ClimbingRoute> Routes { get; set; } = new List<ClimbingRoute>();
    }
}
