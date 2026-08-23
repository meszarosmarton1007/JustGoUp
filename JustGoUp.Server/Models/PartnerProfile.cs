using System.ComponentModel.DataAnnotations;

namespace JustGoUp.Server.Models
{
    public class PartnerProfile : BaseEntity
    {
        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        [Required]
        public int ClimbingGymId { get; set; }
        public virtual ClimbingGym ClimbingGym { get; set; } = null!;

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        [StringLength(10)]
        public string PreferredGradeMin { get; set; } = "5A";

        [Required]
        [StringLength(10)]
        public string PreferredGradeMax { get; set; } = "7A";

        [Required]
        [StringLength(50)]
        public string PreferredStyle { get; set; } = "Mindkettő";

        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string Availability { get; set; } = string.Empty;
    }
}
