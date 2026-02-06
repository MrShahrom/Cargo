using System.ComponentModel.DataAnnotations;

namespace Cargo.API.Entities;

public class Shipment
{
    public Guid Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty; // Group name or Container ID

    public ShipmentStatus Status { get; set; } = ShipmentStatus.Planning;

    public ICollection<Package> Packages { get; set; } = new List<Package>();

    public DateTime? DepartureDate { get; set; }
    public DateTime? ArrivalDate { get; set; }
    
    public double TotalWeight { get; set; }
    public double TotalVolume { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum ShipmentStatus
{
    Planning,
    EnRoute,
    Arrived,
    Completed
}
