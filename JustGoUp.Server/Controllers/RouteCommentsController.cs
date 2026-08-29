using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JustGoUp.Server.Models;
using JustGoUp.Server.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace JustGoUp.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RouteCommentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public RouteCommentsController(AppDbContext context)
        {
            _context = context;
        }

        [AllowAnonymous]
        [HttpGet("route/{routId:int}")]
        public async Task<ActionResult<IEnumerable<object>>> GetCommentsByRoute(int routeId)
        {
            return await _context.RouteComments
                .Include(c => c.User)
                .Where(c => c.ClimbingRouteId == routeId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.Text,
                    c.CreatedAt,
                    c.ParentCommentId,
                    c.ClimbingRouteId,
                    c.UserId,
                    UserName = c.User.Username

                }).ToListAsync();
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult> PostComment(CommentCreateDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("nameid")?.Value
                ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            var newComment = new RouteComment
            {
                Text = dto.CommentText,
                ClimbingRouteId = dto.ClimbingRouteId,
                ParentCommentId = dto.ParentCommentId,
                UserId = int.Parse(userIdClaim),
                CreatedAt = DateTime.UtcNow
            };

            _context.RouteComments.Add(newComment);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(newComment.UserId);
            return Ok(new
            {
                newComment.Id,
                newComment.Text,
                newComment.CreatedAt,
                newComment.ParentCommentId,
                newComment.ClimbingRouteId,
                newComment.UserId,
                UserName = user?.Username ?? "Felhasználó"
            });
        }



        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            var comment = await _context.RouteComments.FindAsync(id);
            if (comment == null) return NotFound();

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("nameid")?.Value
                ?? User.FindFirst("id")?.Value;
            if (comment.UserId.ToString() != userIdClaim) return Forbid("Csak a saját kommentedet törölheted");

            _context.RouteComments.Remove(comment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class CommentCreateDto
    {
        public string CommentText { get; set; } = string.Empty;
        public int ClimbingRouteId { get; set; }
        public int? ParentCommentId { get; set; }
    }
}
