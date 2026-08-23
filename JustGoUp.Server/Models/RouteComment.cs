using System.ComponentModel.DataAnnotations;

namespace JustGoUp.Server.Models
{
    public class RouteComment : BaseEntity
    {
        [Required]
        [StringLength(1000)]
        public string Text { get; set; } = string.Empty;

        //which climbing route this comment belongs to
        [Required]
        public int ClimbingRouteId { get; set; }
        public virtual ClimbingRoute ClimbingRoute { get; set; } = null!;

        //who wrote this comment
        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        // recursive relationship for comments and replies
        // if this comment is a reply to another comment, ParentCommentId will be set to the Id of the parent comment
        public int? ParentCommentId { get; set; }
        public virtual RouteComment? ParentComment { get; set; }

        // child comments (replies) to this comment
        public virtual ICollection<RouteComment> Replies { get; set; } = new List<RouteComment>();
    }
}
