using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JustGoUp.Server.Models;
using JustGoUp.Server.Data;

[Route("api/[controller]")]
[ApiController]
public class ClimbingRoutesController : ControllerBase
{
    private readonly AppDbContext _context;
    public ClimbingRoutesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/ClimbingRoute
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClimbingRoute>>> GetClimbingRoute()
    {
        return await _context.ClimbingRoutes.ToListAsync();
    }

    // GET: api/ClimbingRoute/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ClimbingRoute>> GetClimbingRoute(int id)
    {
        var climbingroute = await _context.ClimbingRoutes.FindAsync(id);

        if (climbingroute == null)
        {
            return NotFound();
        }

        return climbingroute;
    }

    // PUT: api/ClimbingRoute/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{id}")]
    public async Task<IActionResult> PutClimbingRoute(int? id, ClimbingRoute climbingroute)
    {
        if (id != climbingroute.Id)
        {
            return BadRequest();
        }

        _context.Entry(climbingroute).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ClimbingRouteExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    // POST: api/ClimbingRoute
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<ClimbingRoute>> PostClimbingRoute(ClimbingRoute climbingroute)
    {
        _context.ClimbingRoutes.Add(climbingroute);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetClimbingRoute", new { id = climbingroute.Id }, climbingroute);
    }

    // DELETE: api/ClimbingRoute/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClimbingRoute(int? id)
    {
        var climbingroute = await _context.ClimbingRoutes.FindAsync(id);
        if (climbingroute == null)
        {
            return NotFound();
        }

        _context.ClimbingRoutes.Remove(climbingroute);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ClimbingRouteExists(int? id)
    {
        return _context.ClimbingRoutes.Any(e => e.Id == id);
    }
}
