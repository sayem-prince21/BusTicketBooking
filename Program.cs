using BusTicketBooking.Services;
using BusTicketBooking.Data;
using Microsoft.EntityFrameworkCore;
using BusTicketBooking.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;

        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireNonAlphanumeric = true;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

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