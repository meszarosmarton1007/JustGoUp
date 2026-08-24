using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JustGoUp.Server.Models;
using JustGoUp.Server.Data;

[Route("api/[controller]")]
[ApiController]
public class ClimbingGymsController : ControllerBase
{
    private readonly AppDbContext _context;
    public ClimbingGymsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/ClimbingGym
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClimbingGym>>> GetClimbingGym()
    {
        return await _context.ClimbingGyms.ToListAsync();
    }

    // GET: api/ClimbingGym/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ClimbingGym>> GetClimbingGym(int id)
    {
        var climbinggym = await _context.ClimbingGyms.FindAsync(id);

        if (climbinggym == null)
        {
            return NotFound();
        }

        return climbinggym;
    }

    // PUT: api/ClimbingGym/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{id}")]
    public async Task<IActionResult> PutClimbingGym(int? id, ClimbingGym climbinggym)
    {
        if (id != climbinggym.Id)
        {
            return BadRequest();
        }

        _context.Entry(climbinggym).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ClimbingGymExists(id))
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

    // POST: api/ClimbingGym
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<ClimbingGym>> PostClimbingGym(ClimbingGym climbinggym)
    {
        _context.ClimbingGyms.Add(climbinggym);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetClimbingGym", new { id = climbinggym.Id }, climbinggym);
    }

    // DELETE: api/ClimbingGym/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClimbingGym(int? id)
    {
        var climbinggym = await _context.ClimbingGyms.FindAsync(id);
        if (climbinggym == null)
        {
            return NotFound();
        }

        _context.ClimbingGyms.Remove(climbinggym);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ClimbingGymExists(int? id)
    {
        return _context.ClimbingGyms.Any(e => e.Id == id);
    }
}
