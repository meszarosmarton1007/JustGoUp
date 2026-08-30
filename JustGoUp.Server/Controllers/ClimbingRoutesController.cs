using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JustGoUp.Server.Models;
using JustGoUp.Server.Data;
using JustGoUp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.VisualBasic;

namespace JustGoUp.Server.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class ClimbingRoutesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPhotoService _photoService;

        public ClimbingRoutesController(AppDbContext context, IPhotoService photoService)
        {
            _context = context;
            _photoService = photoService;
        }

        [AllowAnonymous]
        [HttpGet("wall/{wallId:int}")]
        public async Task<ActionResult<IEnumerable<object>>> GetRoutesByWall(int wallId)
        {
            return await _context.ClimbingRoutes
                .Include(r => r.ClimbingWall)
                .Where(r => r.ClimbingWallId == wallId)
                .Select(r => new {
                    r.Id, 
                    r.Name, 
                    r.Grade, 
                    r.Description, 
                    r.CanvasDataJson, 
                    r.ImageUrl,
                    r.UserId, 
                    r.ClimbingWallId,
                    GymId = r.ClimbingWall != null ? r.ClimbingWall.ClimbingGymId : 0
                })
                .ToListAsync();
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<ActionResult<object>> GetRoute(int id)
        {
            var route = await _context.ClimbingRoutes
                .Select(r => new { r.Id, r.Name, r.Grade, r.Description, r.CanvasDataJson, r.ImageUrl, r.UserId, r.ClimbingWallId })
                .FirstOrDefaultAsync(r => r.Id == id);

            if (route == null) return NotFound("Az út nem található");
            return route;
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ClimbingRoute>> PostRoute([FromForm] RouteUploadDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("nameid")?.Value
                ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            string imageUrl = string.Empty;
            string imagePublicUrl = string.Empty;

            if(dto.File != null && dto.File.Length > 0)
            {
                var result = await _photoService.AddPhotoAsync(dto.File);
                if (result.Error != null) return BadRequest($"Hiba a képfeltöltés során: {result.Error}");
                imageUrl = result.SecureUrl.AbsoluteUri;
                imagePublicUrl = result.PublicId;
            }

            var newRoute = new ClimbingRoute
            {
                Name = dto.Name,
                Grade = dto.Grade,
                Description = dto.Description,
                CanvasDataJson = dto.CanvasDataJson ?? "[]",
                ClimbingWallId = dto.ClimbingWallId,
                UserId = int.Parse(userIdClaim),
                ImageUrl = imageUrl,
                ImagePublicId = imagePublicUrl
            };

            _context.ClimbingRoutes.Add(newRoute);
            await _context.SaveChangesAsync();

            return Ok(newRoute);
        }

        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutRoute(int id, [FromForm] RouteEditDto dto)
        {
            var route = await _context.ClimbingRoutes.FindAsync(id);
            if (route == null) return NotFound();

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("nameid")?.Value
                ?? User.FindFirst("id")?.Value;
            if (route.UserId.ToString() != userIdClaim) return Forbid();

            route.Name = dto.Name;
            route.Grade = dto.Grade;
            route.Description = dto.Description;
            route.CanvasDataJson = dto.CanvasDataJson ?? route.CanvasDataJson;

            if(dto.File != null && dto.File.Length > 0)
            {
                if (!string.IsNullOrEmpty(route.ImagePublicId)) await _photoService.DeletePhotoAsync(route.ImagePublicId);
                var result = await _photoService.AddPhotoAsync(dto.File);
                route.ImageUrl = result.SecureUrl.AbsoluteUri;
                route.ImagePublicId = result.PublicId;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }


        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteRoute(int id)
        {
            var route = await _context.ClimbingRoutes.FindAsync(id);
            if (route == null) return NotFound();

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("nameid")?.Value
                ?? User.FindFirst("id")?.Value;
            if (route.UserId.ToString() != userIdClaim) return Forbid();

            if (!string.IsNullOrEmpty(route.ImagePublicId)) await _photoService.DeletePhotoAsync(route.ImagePublicId);

            _context.ClimbingRoutes.Remove(route);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class RouteUploadDto
    {
        public string Name { get; set; } = string.Empty;
        public string Grade { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? CanvasDataJson { get; set; }
        public int ClimbingWallId { get; set; }
        public IFormFile? File { get; set; }
    }

    public class RouteEditDto
    {
        public string Name { get; set; } = string.Empty;
        public string Grade { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? CanvasDataJson { get; set; }
        public IFormFile? File { get; set; }
    }

}
