using Cargo.API.Entities;
using Cargo.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cargo.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly ClientService _clientService;

    public ClientsController(ClientService clientService)
    {
        _clientService = clientService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<Client>> Register(RegisterClientDto dto)
    {
        var client = await _clientService.RegisterClientAsync(dto.Name, dto.Phone, dto.ChatId);
        return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);
    }

    [HttpGet]
    public async Task<ActionResult<List<Client>>> GetAll()
    {
        return await _clientService.GetAllClientsAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Client>> GetById(Guid id)
    {
        var client = await _clientService.GetClientByIdAsync(id);
        if (client == null) return NotFound();
        return Ok(client);
    }

    [HttpGet("by-human-id/{humanId}")]
    public async Task<ActionResult<Client>> GetByHumanId(string humanId)
    {
        var client = await _clientService.GetClientByHumanIdAsync(humanId);
        if (client == null) return NotFound();
        return Ok(client);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Client>> Update(Guid id, UpdateClientDto dto)
    {
        var client = await _clientService.UpdateClientAsync(id, dto.Name, dto.Phone, dto.ChatId);
        if (client == null) return NotFound();
        return Ok(client);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _clientService.DeleteClientAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}

public class RegisterClientDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? ChatId { get; set; }
}

public class UpdateClientDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? ChatId { get; set; }
}
