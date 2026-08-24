using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JustGoUp.Server.Models;
using JustGoUp.Server.Data;

[Route("api/[controller]")]
[ApiController]
public class RouteCommentsController : ControllerBase
{
    private readonly AppDbContext _context;
    public RouteCommentsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/RouteComment
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RouteComment>>> GetRouteComment()
    {
        return await _context.RouteComments.ToListAsync();
    }

    // GET: api/RouteComment/5
    [HttpGet("{id}")]
    public async Task<ActionResult<RouteComment>> GetRouteComment(int id)
    {
        var routecomment = await _context.RouteComments.FindAsync(id);

        if (routecomment == null)
        {
            return NotFound();
        }

        return routecomment;
    }

    // PUT: api/RouteComment/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{id}")]
    public async Task<IActionResult> PutRouteComment(int? id, RouteComment routecomment)
    {
        if (id != routecomment.Id)
        {
            return BadRequest();
        }

        _context.Entry(routecomment).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!RouteCommentExists(id))
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

    // POST: api/RouteComment
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<RouteComment>> PostRouteComment(RouteComment routecomment)
    {
        _context.RouteComments.Add(routecomment);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetRouteComment", new { id = routecomment.Id }, routecomment);
    }

    // DELETE: api/RouteComment/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRouteComment(int? id)
    {
        var routecomment = await _context.RouteComments.FindAsync(id);
        if (routecomment == null)
        {
            return NotFound();
        }

        _context.RouteComments.Remove(routecomment);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool RouteCommentExists(int? id)
    {
        return _context.RouteComments.Any(e => e.Id == id);
    }
}
