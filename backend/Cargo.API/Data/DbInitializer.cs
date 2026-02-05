using Cargo.API.Entities;
using Cargo.API.Services;
using Microsoft.EntityFrameworkCore;

namespace Cargo.API.Data;

public static class DbInitializer
{
    public static async Task SeedUsers(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var authService = scope.ServiceProvider.GetRequiredService<AuthService>();

        await context.Database.MigrateAsync();

        if (!await context.Users.AnyAsync())
        {
            var admin = new User
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                PasswordHash = authService.HashPassword("admin"),
                Role = "Admin"
            };

            var manager = new User
            {
                Id = Guid.NewGuid(),
                Username = "manager",
                PasswordHash = authService.HashPassword("manager"),
                Role = "Manager"
            };

            context.Users.AddRange(admin, manager);
            await context.SaveChangesAsync();
        }
    }
}
