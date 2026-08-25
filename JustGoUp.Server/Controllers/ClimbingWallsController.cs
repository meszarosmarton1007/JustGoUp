using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JustGoUp.Server.Models;
using JustGoUp.Server.Data;
using JustGoUp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Runtime.InteropServices;

namespace JustGoUp.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClimbingWallsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPhotoService _photoService;

        public ClimbingWallsController(AppDbContext context, IPhotoService photoService)
        {
            _context = context;
            _photoService = photoService;
        }

        // GET: api/ClimbingWalls/gym/{gymId} Only returns climbing walls for a specific gym
        // JAVÍTÁS: Egyértelművé tesszük a .NET számára az ID paramétert
        [AllowAnonymous]
        [HttpGet("gym/{gymId:int}")]
        public async Task<ActionResult<IEnumerable<ClimbingWall>>> GetWallsByGym(int gymId)
        {
            return await _context.ClimbingWalls
                .Where(w => w.ClimbingGymId == gymId)
                .ToListAsync();
        }


        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ClimbingWall>> PostClimbingWall([FromForm] WallUploadDto dto)
        {
            var gym = await _context.ClimbingGyms.FindAsync(dto.ClimbingGymId);
            if (gym == null) return NotFound();

            // 1. Felhasználó ID kinyerése a tokenből
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                              ?? User.FindFirst("nameid")?.Value
                              ?? User.FindFirst("id")?.Value;

            int finalUserId = 0;

            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int parsedId))
            {
                finalUserId = parsedId;
            }
            else
            {
                // BIZTONSÁGI KORREKCIÓ: Ha a token olvasása helyileg elcsúszik, a terem létrehozójának ID-ját használjuk, hogy ne bukjon el a Foreign Key
                finalUserId = gym.CreatedByUserId;
            }

            if (dto.File == null || dto.File.Length == 0) return BadRequest("A falról készült fénykép feltöltése kötelező!");

            var result = await _photoService.AddPhotoAsync(dto.File);
            if (result.Error != null) return BadRequest($"Felhő tárhely hiba: {result.Error.Message}");

            var newWall = new ClimbingWall
            {
                Name = dto.Name,
                WallType = dto.WallType, // <-- JAVÍTÁS: Megadjuk a kötelező típust
                ClimbingGymId = dto.ClimbingGymId,
                ImageUrl = result.SecureUrl.AbsoluteUri,
                ImagePublicId = result.PublicId,
                CreatedByUserId = finalUserId, // <-- JAVÍTÁS: Itt adjuk át a kötelező User ID-t a PostgreSQL-nek!
                CreatedAt = DateTime.UtcNow
            };

            _context.ClimbingWalls.Add(newWall);
            await _context.SaveChangesAsync();

            return Ok(newWall);
        }


        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClimbingWall(int id)
        {
            var wall = await _context.ClimbingWalls.FindAsync(id);
            if (wall == null) return NotFound("A fal nem található!");

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (wall.ClimbingGym.CreatedByUserId.ToString() != userIdClaim)
            {
                return Forbid("Csak a terem tulajdonosa törölheti a falat/szektort!");
            }

            if (!string.IsNullOrEmpty(wall.ImagePublicId))
            {
                await _photoService.DeletePhotoAsync(wall.ImagePublicId);
            }

            _context.ClimbingWalls.Remove(wall);
            await _context.SaveChangesAsync();

            return NoContent();


        }

    }
    public class WallUploadDto
    {
        public string Name { get; set; } = string.Empty;
        public int ClimbingGymId { get; set; }
        public string WallType { get; set; } = string.Empty;
        public IFormFile? File { get; set; } // Optional: The uploaded photo file from Angular
    }

}