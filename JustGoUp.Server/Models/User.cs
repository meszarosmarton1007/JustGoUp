using System.ComponentModel.DataAnnotations;

namespace JustGoUp.Server.Models
{
    public class User : BaseEntity
    {
        [Required]
        [StringLength(50, MinimumLength = 3)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [Phone]
        [StringLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public DateTime BirthDate { get; set; }

        [Required]
        public UserRole Role { get; set; } = UserRole.User;

        [Required]
        public string SecurityStamp { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public bool hasAcceptedTerms { get; set; } = false;

        [Required]
        public DateTime TermsAcceptedAt { get; set; }

        [Required]
        [StringLength(10)]
        public string AcceptedPrivacyPolicyVersion { get; set; } = "v1.0";

        [Required]
        public int AccesFailedCount { get; set; } = 0;

        public DateTimeOffset? LockoutEnd { get; set; }

        //Connections
        public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
        public virtual PartnerProfile? PartnerProfile { get; set; }
        public virtual ICollection<ClimbingGym> CreatedGyms { get; set; } = new List<ClimbingGym>();
        public virtual ICollection<ClimbingWall> CreatedWalls { get; set; } = new List<ClimbingWall>();
        public virtual ICollection<ClimbingRoute> CreatedRoutes { get; set; } = new List<ClimbingRoute>();
        public virtual ICollection<AscentLog> Ascents { get; set; } = new List<AscentLog>();
        public virtual ICollection<Friendship> SentFriendRequests { get; set; } = new List<Friendship>();
        public virtual ICollection<Friendship> ReceivedFriendRequests { get; set; } = new List<Friendship>();
        public virtual ICollection<ChatMessage> SentMessages { get; set; } = new List<ChatMessage>();
        public virtual ICollection<ChatMessage> ReceivedMessages { get; set; } = new List<ChatMessage>();
        public virtual ICollection<RouteComment> RouteComments { get; set; } = new List<RouteComment>();

    }
}
