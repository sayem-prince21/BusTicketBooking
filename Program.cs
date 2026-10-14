using BusTicketBooking.Services;
using BusTicketBooking.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySQL(connectionString!));


// Add controller services
builder.Services.AddControllers();

// In-memory ticket store
builder.Services.AddSingleton<TicketService>();

var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.UseRouting();

app.MapControllers();

app.Run();