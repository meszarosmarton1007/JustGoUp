using System.ComponentModel.DataAnnotations;

namespace JustGoUp.Server.Models
{
    public class ClimbingGym : BaseEntity
    {
        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;
        [Required]
        [StringLength(255)]
        public string Address { get; set; } = string.Empty;
        [Required]
        [StringLength(1000)]
        public string? Description { get; set; } = string.Empty;

        [Required]
        public int CreatedByUserId { get; set; }
        public virtual User CreatedByUser { get; set; } = null!;

        public virtual ICollection<ClimbingWall> Walls { get; set; } = new List<ClimbingWall>();
        public virtual ICollection<PartnerProfile> LookingForPartnersHere { get; set; } = new List<PartnerProfile>();

    }
}
