using Cargo.API.Data;
using Cargo.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cargo.API.Services;

public class ShipmentService
{
    private readonly AppDbContext _context;
    private readonly NotificationService _notificationService;

    public ShipmentService(AppDbContext context, NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<Shipment> CreateShipmentAsync(string name)
    {
        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            Name = name,
            Status = ShipmentStatus.Planning,
            CreatedAt = DateTime.UtcNow
        };
        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync();
        return shipment;
    }

    public async Task AddPackageToShipmentAsync(Guid shipmentId, Guid packageId)
    {
        var package = await _context.Packages.FindAsync(packageId);
        if (package == null) throw new Exception("Package not found");

        package.ShipmentId = shipmentId;
        // Optionally update package status to match shipment or stay InWarehouse until Shipment departs
        await _context.SaveChangesAsync();
    }

    public async Task UpdateStatusAsync(Guid shipmentId, ShipmentStatus status)
    {
        var shipment = await _context.Shipments
            .Include(s => s.Packages)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);
            
        if (shipment == null) throw new Exception("Shipment not found");

        shipment.Status = status;
        
        // Propagate status to packages
        PackageStatus pkgStatus = status switch
        {
            ShipmentStatus.EnRoute => PackageStatus.EnRoute,
            ShipmentStatus.Arrived => PackageStatus.Arrived,
            ShipmentStatus.Completed => PackageStatus.Arrived, // Or Delivered via separate flow
            _ => PackageStatus.InWarehouse
        };

        foreach (var pkg in shipment.Packages)
        {
            pkg.Status = pkgStatus;
            await _notificationService.SendStatusUpdateAsync(pkg.ClientId, pkg.TrackingCode, pkgStatus.ToString());
        }

        await _context.SaveChangesAsync();
    }

    public async Task<Shipment?> UpdateShipmentAsync(Guid id, string name)
    {
        var shipment = await _context.Shipments.FindAsync(id);
        if (shipment == null) return null;

        shipment.Name = name;
        await _context.SaveChangesAsync();
        return shipment;
    }

    public async Task<bool> DeleteShipmentAsync(Guid id)
    {
        var shipment = await _context.Shipments.FindAsync(id);
        if (shipment == null) return false;

        _context.Shipments.Remove(shipment);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<Shipment>> GetAllShipmentsAsync()
    {
        return await _context.Shipments
            .Include(s => s.Packages)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }
}
