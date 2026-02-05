using Cargo.API.Data;
using Cargo.API.Entities;
using Cargo.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cargo.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var users = await _context.Users
            .Select(u => new UserDto { Id = u.Id, Username = u.Username, Role = u.Role })
            .ToListAsync();
        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateManager(CreateUserDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
        {
            return Conflict("Username already exists");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = dto.Username,
            Role = "Manager",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new UserDto { Id = user.Id, Username = user.Username, Role = user.Role });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        // Prevent deleting self? Or last admin? For now, we allow it but frontend can handle "current user" check.
        // Let's at least protect the specific seed Admin if we wanted, but for now simple delete is fine.
        
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class CreateUserDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
