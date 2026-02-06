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

    public async Task<Shipment> CreateShipmentAsync(string name, List<Guid> packageIds)
    {
        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            Name = name,
            Status = ShipmentStatus.Planning,
            CreatedAt = DateTime.UtcNow
        };

        if (packageIds != null && packageIds.Any())
        {
            var packages = await _context.Packages
                .Where(p => packageIds.Contains(p.Id) && p.ShipmentId == null)
                .ToListAsync();

            foreach (var pkg in packages)
            {
                pkg.ShipmentId = shipment.Id;
            }

            shipment.Packages = packages;
            shipment.TotalWeight = packages.Sum(p => p.Weight);
            shipment.TotalVolume = packages.Sum(p => p.Volume);
        }

        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync();
        return shipment;
    }

    public async Task AddPackageToShipmentAsync(Guid shipmentId, Guid packageId)
    {
        var package = await _context.Packages.FindAsync(packageId);
        if (package == null) throw new Exception("Package not found");

        package.ShipmentId = shipmentId;
        await _context.SaveChangesAsync();
        await RecalculateTotalsAsync(shipmentId);
    }

    public async Task AddPackageByTrackingCodeAsync(Guid shipmentId, string trackingCode)
    {
        var package = await _context.Packages.FirstOrDefaultAsync(p => p.TrackingCode == trackingCode);
        if (package == null) throw new Exception("Package with this tracking code not found");

        if (package.ShipmentId.HasValue && package.ShipmentId != shipmentId)
        {
             throw new Exception("Package is already in another shipment");
        }

        package.ShipmentId = shipmentId;
        await _context.SaveChangesAsync();
        await RecalculateTotalsAsync(shipmentId);
    }

    public async Task RecalculateTotalsAsync(Guid shipmentId)
    {
        var shipment = await _context.Shipments
            .Include(s => s.Packages)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);

        if (shipment != null)
        {
            shipment.TotalWeight = shipment.Packages.Sum(p => p.Weight);
            shipment.TotalVolume = shipment.Packages.Sum(p => p.Volume);
            await _context.SaveChangesAsync();
        }
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

        if (status == ShipmentStatus.EnRoute && shipment.DepartureDate == null)
        {
            shipment.DepartureDate = DateTime.UtcNow;
        }

        if (status == ShipmentStatus.Arrived && shipment.ArrivalDate == null)
        {
            shipment.ArrivalDate = DateTime.UtcNow;
        }

        foreach (var pkg in shipment.Packages)
        {
            pkg.Status = pkgStatus;
            await _notificationService.SendStatusUpdateAsync(pkg.ClientId, pkg.TrackingCode, pkgStatus.ToString());
        }

        await _context.SaveChangesAsync();
    }

    public async Task<Shipment?> UpdateShipmentAsync(Guid id, string name, List<Guid>? packageIds = null)
    {
        var shipment = await _context.Shipments
            .Include(s => s.Packages)
            .FirstOrDefaultAsync(s => s.Id == id);
            
        if (shipment == null) return null;

        shipment.Name = name;

        if (packageIds != null)
        {
            // 1. Identify packages to remove
            var packagesToRemove = shipment.Packages.Where(p => !packageIds.Contains(p.Id)).ToList();
            foreach (var pkg in packagesToRemove)
            {
                pkg.ShipmentId = null; 
            }

            // 2. Identify packages to add
            // Only add packages that are NOT currently in this shipment.
            // Note: need to fetch them.
            // Also ensure we don't steal packages from other shipments unless intended. 
            // For now, allow stealing or require them to be free?
            // "Available" typically means ShipmentId is null.
            // Let's assume the UI sends valid IDs.
            
            var existingIds = shipment.Packages.Select(p => p.Id).ToList();
            var newIds = packageIds.Where(id => !existingIds.Contains(id)).ToList();

            if (newIds.Any())
            {
                var newPackages = await _context.Packages
                    .Where(p => newIds.Contains(p.Id))
                    .ToListAsync();

                foreach (var pkg in newPackages)
                {
                    // Optional safety: if (pkg.ShipmentId != null) throw... 
                    // But maybe user wants to move? Let's allow overwrite for flexibility.
                    pkg.ShipmentId = shipment.Id;
                }
            }
        }

        await _context.SaveChangesAsync();
        await RecalculateTotalsAsync(id);
        
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
