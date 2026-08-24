using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JustGoUp.Server.Models;
using JustGoUp.Server.Data;

[Route("api/[controller]")]
[ApiController]
public class ClimbingWallsController : ControllerBase
{
    private readonly AppDbContext _context;
    public ClimbingWallsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/ClimbingWall
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClimbingWall>>> GetClimbingWall()
    {
        return await _context.ClimbingWalls.ToListAsync();
    }

    // GET: api/ClimbingWall/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ClimbingWall>> GetClimbingWall(int id)
    {
        var climbingwall = await _context.ClimbingWalls.FindAsync(id);

        if (climbingwall == null)
        {
            return NotFound();
        }

        return climbingwall;
    }

    // PUT: api/ClimbingWall/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{id}")]
    public async Task<IActionResult> PutClimbingWall(int? id, ClimbingWall climbingwall)
    {
        if (id != climbingwall.Id)
        {
            return BadRequest();
        }

        _context.Entry(climbingwall).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ClimbingWallExists(id))
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

    // POST: api/ClimbingWall
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<ClimbingWall>> PostClimbingWall(ClimbingWall climbingwall)
    {
        _context.ClimbingWalls.Add(climbingwall);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetClimbingWall", new { id = climbingwall.Id }, climbingwall);
    }

    // DELETE: api/ClimbingWall/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClimbingWall(int? id)
    {
        var climbingwall = await _context.ClimbingWalls.FindAsync(id);
        if (climbingwall == null)
        {
            return NotFound();
        }

        _context.ClimbingWalls.Remove(climbingwall);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ClimbingWallExists(int? id)
    {
        return _context.ClimbingWalls.Any(e => e.Id == id);
    }
}
