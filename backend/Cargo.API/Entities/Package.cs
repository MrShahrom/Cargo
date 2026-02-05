using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Cargo.API.Entities;

public class Package
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string TrackingCode { get; set; } = string.Empty;

    public double Weight { get; set; } // kg
    public double Volume { get; set; } // m3

    public decimal Price { get; set; }

    public PackageStatus Status { get; set; } = PackageStatus.Registered;

    public Guid ClientId { get; set; }
    public Client? Client { get; set; }

    public Guid? ShipmentId { get; set; }
    public Shipment? Shipment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeliveredAt { get; set; }
}

public enum PackageStatus
{
    Registered,
    InWarehouse,
    EnRoute, // In transit
    Arrived, // At destination warehouse
    Delivered // Picked up by client
}
