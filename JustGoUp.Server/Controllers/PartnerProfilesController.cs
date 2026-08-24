using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JustGoUp.Server.Models;
using JustGoUp.Server.Data;

[Route("api/[controller]")]
[ApiController]
public class PartnerProfilesController : ControllerBase
{
    private readonly AppDbContext _context;
    public PartnerProfilesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/PartnerProfile
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PartnerProfile>>> GetPartnerProfile()
    {
        return await _context.PartnerProfiles.ToListAsync();
    }

    // GET: api/PartnerProfile/5
    [HttpGet("{id}")]
    public async Task<ActionResult<PartnerProfile>> GetPartnerProfile(int id)
    {
        var partnerprofile = await _context.PartnerProfiles.FindAsync(id);

        if (partnerprofile == null)
        {
            return NotFound();
        }

        return partnerprofile;
    }

    // PUT: api/PartnerProfile/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{id}")]
    public async Task<IActionResult> PutPartnerProfile(int? id, PartnerProfile partnerprofile)
    {
        if (id != partnerprofile.Id)
        {
            return BadRequest();
        }

        _context.Entry(partnerprofile).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!PartnerProfileExists(id))
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

    // POST: api/PartnerProfile
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<PartnerProfile>> PostPartnerProfile(PartnerProfile partnerprofile)
    {
        _context.PartnerProfiles.Add(partnerprofile);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetPartnerProfile", new { id = partnerprofile.Id }, partnerprofile);
    }

    // DELETE: api/PartnerProfile/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePartnerProfile(int? id)
    {
        var partnerprofile = await _context.PartnerProfiles.FindAsync(id);
        if (partnerprofile == null)
        {
            return NotFound();
        }

        _context.PartnerProfiles.Remove(partnerprofile);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool PartnerProfileExists(int? id)
    {
        return _context.PartnerProfiles.Any(e => e.Id == id);
    }
}
