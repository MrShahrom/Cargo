using Cargo.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cargo.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Client> Clients { get; set; }
    public DbSet<Package> Packages { get; set; }
    public DbSet<Shipment> Shipments { get; set; }
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Client - HumanId unique index
        modelBuilder.Entity<Client>()
            .HasIndex(c => c.HumanId)
            .IsUnique();

        // Package - TrackingCode unique index
        modelBuilder.Entity<Package>()
            .HasIndex(p => p.TrackingCode)
            .IsUnique();
            
        // Package - Shipment relationship
        modelBuilder.Entity<Package>()
            .HasOne(p => p.Shipment)
            .WithMany(s => s.Packages)
            .HasForeignKey(p => p.ShipmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
