using Cargo.API.Data;
using Cargo.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cargo.API.Services;

public class ClientService
{
    private readonly AppDbContext _context;

    public ClientService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Client> RegisterClientAsync(string name, string phone, string? chatId)
    {
        var lastClient = await _context.Clients
            .OrderByDescending(c => c.HumanId)
            .FirstOrDefaultAsync();

        string newHumanId = "A00001";

        if (lastClient != null)
        {
            // Parse existing ID: A00001 -> 1
            if (int.TryParse(lastClient.HumanId.Substring(1), out int lastIdNum))
            {
                newHumanId = $"A{lastIdNum + 1:D5}";
            }
        }

        var client = new Client
        {
            Id = Guid.NewGuid(),
            HumanId = newHumanId,
            Name = name,
            Phone = phone,
            ChatId = chatId
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        return client;
    }

    public async Task<List<Client>> GetAllClientsAsync()
    {
        return await _context.Clients.ToListAsync();
    }
    
    public async Task<Client?> GetClientByIdAsync(Guid id)
    {
        return await _context.Clients.FindAsync(id);
    }
    
    public async Task<Client?> GetClientByHumanIdAsync(string humanId)
    {
        return await _context.Clients.FirstOrDefaultAsync(c => c.HumanId == humanId);
    }

    public async Task<Client?> UpdateClientAsync(Guid id, string name, string phone, string? chatId)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return null;

        client.Name = name;
        client.Phone = phone;
        client.ChatId = chatId;

        await _context.SaveChangesAsync();
        return client;
    }

    public async Task<bool> DeleteClientAsync(Guid id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return false;

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();
        return true;
    }
}
