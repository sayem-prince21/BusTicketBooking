using BusTicketBooking.Services;

var builder = WebApplication.CreateBuilder(args);

// Add controller services
builder.Services.AddControllers();

// In-memory ticket store
builder.Services.AddSingleton<TicketService>();

var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.UseRouting();

app.MapControllers();

app.Run();