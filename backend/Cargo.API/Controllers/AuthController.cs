using Cargo.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Cargo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var token = await _authService.LoginAsync(dto.Username, dto.Password);
        
        if (token == null)
            return Unauthorized("Invalid credentials");

        // Consider returning Role as well to help frontend
        return Ok(new { Token = token });
    }
}

public class LoginDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
