using Cargo.API.Entities;
using Cargo.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cargo.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PackagesController : ControllerBase
{
    private readonly PackageService _packageService;
    private readonly ClientService _clientService;

    public PackagesController(PackageService packageService, ClientService clientService)
    {
        _packageService = packageService;
        _clientService = clientService;
    }

    [HttpPost]
    public async Task<ActionResult<Package>> Create(CreatePackageDto dto)
    {
        // Resolve ClientId from HumanId if provided, or raw ClientId
        Guid clientId = dto.ClientId;
        if (dto.ClientId == Guid.Empty && !string.IsNullOrEmpty(dto.ClientHumanId))
        {
            var client = await _clientService.GetClientByHumanIdAsync(dto.ClientHumanId);
            if (client == null) return BadRequest("Client not found");
            clientId = client.Id;
        }

        if (clientId == Guid.Empty) return BadRequest("Client ID required");

        // Check if package exists
        var existing = await _packageService.GetByTrackingCodeAsync(dto.TrackingCode);
        if (existing != null) return Conflict("Package with this tracking code already exists");

        var package = await _packageService.CreatePackageAsync(dto.TrackingCode, clientId, dto.Weight, dto.Volume, dto.Price);
        return CreatedAtAction(nameof(GetByTrackingCode), new { trackingCode = package.TrackingCode }, package);
    }

    [HttpGet("{trackingCode}")]
    public async Task<ActionResult<Package>> GetByTrackingCode(string trackingCode)
    {
        var package = await _packageService.GetByTrackingCodeAsync(trackingCode);
        if (package == null) return NotFound();
        return Ok(package);
    }

    [HttpGet]
    public async Task<ActionResult<List<Package>>> GetAll()
    {
        return await _packageService.GetAllPackagesAsync();
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Package>> Update(Guid id, UpdatePackageDto dto)
    {
        try
        {
            var package = await _packageService.UpdatePackageAsync(id, dto.TrackingCode, dto.Weight, dto.Volume, dto.Price);
            if (package == null) return NotFound();
            return Ok(package);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _packageService.DeletePackageAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}

public class CreatePackageDto
{
    public string TrackingCode { get; set; } = string.Empty;
    public Guid ClientId { get; set; }
    public string? ClientHumanId { get; set; } // Option to pass "A00001"
    public double Weight { get; set; }
    public double Volume { get; set; }
    public decimal Price { get; set; }
}

public class UpdatePackageDto
{
    public string TrackingCode { get; set; } = string.Empty;
    public double Weight { get; set; }
    public double Volume { get; set; }
    public decimal Price { get; set; }
}
