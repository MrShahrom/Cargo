using Cargo.API.Data;
using Cargo.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cargo.API.Services;

public class PackageService
{
    private readonly AppDbContext _context;
    // Using IServiceProvider or similar to avoid circular dependency if ShipmentService depends on PackageService in future, 
    // but effectively here we can just inject it if no cycle exists.
    // However, checking program.cs: all are scoped. 
    // If ShipmentService depends on PackageService (it doesn't), cycle exists.
    // Let's check: ShipmentService(AppDbContext, NotificationService). Safe.
    private readonly ShipmentService _shipmentService;

    public PackageService(AppDbContext context, ShipmentService shipmentService)
    {
        _context = context;
        _shipmentService = shipmentService;
    }

    public async Task<Package> CreatePackageAsync(string trackingCode, Guid clientId, double weight, double volume, decimal price)
    {
        var package = new Package
        {
            Id = Guid.NewGuid(),
            TrackingCode = trackingCode,
            ClientId = clientId,
            Weight = weight,
            Volume = volume,
            Price = price, // Logic for price calc might be needed later
            Status = PackageStatus.InWarehouse,
            CreatedAt = DateTime.UtcNow
        };

        _context.Packages.Add(package);
        await _context.SaveChangesAsync();
        return package;
    }

    public async Task<Package?> GetByTrackingCodeAsync(string trackingCode)
    {
        return await _context.Packages
            .Include(p => p.Client)
            .Include(p => p.Shipment)
            .FirstOrDefaultAsync(p => p.TrackingCode == trackingCode);
    }

    public async Task<List<Package>> GetPackagesByClientAsync(Guid clientId)
    {
        return await _context.Packages
            .Where(p => p.ClientId == clientId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }
    
    public async Task<Package?> UpdatePackageAsync(Guid id, string trackingCode, double weight, double volume, decimal price)
    {
        var package = await _context.Packages.FindAsync(id);
        if (package == null) return null;

        // Check if tracking code is changed and unique
        if (package.TrackingCode != trackingCode)
        {
            var exists = await _context.Packages.AnyAsync(p => p.TrackingCode == trackingCode && p.Id != id);
            if (exists) throw new InvalidOperationException("Tracking code already exists");
            package.TrackingCode = trackingCode;
        }

        bool dimensionsChanged = Math.Abs(package.Weight - weight) > 0.001 || Math.Abs(package.Volume - volume) > 0.001;

        package.Weight = weight;
        package.Volume = volume;
        package.Price = price;
        
        await _context.SaveChangesAsync();

        if (dimensionsChanged && package.ShipmentId.HasValue)
        {
            await _shipmentService.RecalculateTotalsAsync(package.ShipmentId.Value);
        }

        return package;
    }

    public async Task<bool> DeletePackageAsync(Guid id)
    {
        var package = await _context.Packages.FindAsync(id);
        if (package == null) return false;

        _context.Packages.Remove(package);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<Package>> GetAllPackagesAsync()
    {
        return await _context.Packages
            .Include(p => p.Client)
            .Include(p => p.Shipment)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }
}
