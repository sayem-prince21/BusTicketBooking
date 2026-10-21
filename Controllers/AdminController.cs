
using BusTicketBooking.Data;
using BusTicketBooking.DTOs;
using BusTicketBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusTicketBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/admin/dashboard
        [HttpGet("dashboard")]
        public IActionResult GetDashboard()
        {
            return Ok(new
            {
                Message = "Welcome to the Admin Dashboard!",
                Role = "Admin",
                CanManageBookings = true
            });
        }

        // GET: api/admin/dashboard/summary
        [HttpGet("dashboard/summary")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var customers =
                await _userManager.GetUsersInRoleAsync("Customer");

            var totalBookings = await _context.Bookings.CountAsync();

            var confirmedBookings = await _context.Bookings
                .CountAsync(b => b.Status == "Confirmed");

            var cancelledBookings = await _context.Bookings
                .CountAsync(b => b.Status == "Cancelled");

            var summary = new AdminDashboardSummaryDto
            {
                TotalCustomers = customers.Count,
                TotalBookings = totalBookings,
                ConfirmedBookings = confirmedBookings,
                CancelledBookings = cancelledBookings
            };

            return Ok(summary);
        }
    }
}
