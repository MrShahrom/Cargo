using Telegram.Bot;

namespace Cargo.API.Services;

public class NotificationService
{
    private readonly ITelegramBotClient? _botClient;
    private readonly ClientService _clientService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IConfiguration configuration, ClientService clientService, ILogger<NotificationService> logger)
    {
        _clientService = clientService;
        _logger = logger;
        var token = configuration["TelegramBotToken"];
        if (!string.IsNullOrEmpty(token))
        {
            _botClient = new TelegramBotClient(token);
        }
    }

    public async Task SendStatusUpdateAsync(Guid clientId, string trackingCode, string newStatus)
    {
        if (_botClient == null) return;

        var client = await _clientService.GetClientByIdAsync(clientId);
        if (client == null || string.IsNullOrEmpty(client.ChatId)) return;

        var message = $"📦 <b>Package Update</b>\n\n" +
                      $"Tracking Code: <code>{trackingCode}</code>\n" +
                      $"New Status: <b>{newStatus}</b>";

        try
        {
            await _botClient.SendMessage(
                chatId: client.ChatId,
                text: message,
                parseMode: Telegram.Bot.Types.Enums.ParseMode.Html
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Telegram notification to {ChatId}", client.ChatId);
        }
    }
}
