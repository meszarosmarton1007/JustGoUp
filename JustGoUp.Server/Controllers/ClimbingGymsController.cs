using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using JustGoUp.Server.Data;
using JustGoUp.Server.Models;
using System.Security.Claims;

namespace JustGoUp.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClimbingGymsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClimbingGymsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ClimbingGyms anyone can view the climbing gyms
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetClimbingGyms()
        {
            // Visszaadjuk a termeket és a létrehozó azonosítóját is a frontend ellenőrzéshez
            return await _context.ClimbingGyms
                .Select(g => new { g.Id, g.Name, g.Address, g.Description, g.CreatedByUserId })
                .ToListAsync();
        }

        // GET: api/ClimbingGyms/5 anyone can view a specific climbing gym
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetClimbingGym(int id)
        {
            var gym = await _context.ClimbingGyms
                .Select(g => new { g.Id, g.Name, g.Address, g.Description, g.CreatedByUserId })
                .FirstOrDefaultAsync(g => g.Id == id);

            if (gym == null) return NotFound("A mászóterem nem található.");
            return gym;
        }

        // POST: api/ClimbingGyms only authenticated users can create a climbing gym
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ClimbingGym>> PostClimbingGym(ClimbingGym gym)
        {
            // Kiolvassuk a bejelentkezett mászó ID-ját a JWT tokenből
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            gym.CreatedByUserId = int.Parse(userIdClaim);
            gym.CreatedAt = DateTime.UtcNow;

            _context.ClimbingGyms.Add(gym);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClimbingGym), new { id = gym.Id }, gym);
        }

        // PUT: api/ClimbingGyms/5 only the owner can edit the climbing gym
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutClimbingGym(int id, ClimbingGym gym)
        {
            if (id != gym.Id) return BadRequest("Hibás azonosító.");

            var existingGym = await _context.ClimbingGyms.FindAsync(id);
            if (existingGym == null) return NotFound();

            // only the user who created the gym can edit it
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim != existingGym.CreatedByUserId.ToString())
            {
                return Forbid("Nincs jogosultságod a terem szerkesztéséhez!");
            }

            existingGym.Name = gym.Name;
            existingGym.Address = gym.Address;
            existingGym.Description = gym.Description;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.ClimbingGyms.AnyAsync(e => e.Id == id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE: api/ClimbingGyms/5 only the owner can delete the climbing gym
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClimbingGym(int id)
        {
            var gym = await _context.ClimbingGyms.FindAsync(id);
            if (gym == null) return NotFound();

            // TULAJDONJOG ELLENŐRZÉSE: Csak az törölheti, aki létrehozta!
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim != gym.CreatedByUserId.ToString())
            {
                return Forbid("Nincs jogosultságod a terem törléséhez!");
            }

            _context.ClimbingGyms.Remove(gym);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
