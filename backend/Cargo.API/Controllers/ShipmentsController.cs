using Cargo.API.Entities;
using Cargo.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cargo.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ShipmentsController : ControllerBase
{
    private readonly ShipmentService _shipmentService;

    public ShipmentsController(ShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    [HttpPost]
    public async Task<ActionResult<Shipment>> Create(CreateShipmentDto dto)
    {
        var shipment = await _shipmentService.CreateShipmentAsync(dto.Name);
        return Ok(shipment);
    }

    [HttpPost("{id}/add-package")]
    public async Task<IActionResult> AddPackage(Guid id, [FromBody] Guid packageId)
    {
        try
        {
            await _shipmentService.AddPackageToShipmentAsync(id, packageId);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] ShipmentStatus status)
    {
        try
        {
            await _shipmentService.UpdateStatusAsync(id, status);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Shipment>> Update(Guid id, UpdateShipmentDto dto)
    {
        var shipment = await _shipmentService.UpdateShipmentAsync(id, dto.Name);
        if (shipment == null) return NotFound();
        return Ok(shipment);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _shipmentService.DeleteShipmentAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet]
    public async Task<ActionResult<List<Shipment>>> GetAll()
    {
        return await _shipmentService.GetAllShipmentsAsync();
    }
}

public class CreateShipmentDto
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateShipmentDto
{
    public string Name { get; set; } = string.Empty;
}
