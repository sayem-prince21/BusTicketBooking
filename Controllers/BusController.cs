
using BusTicketBooking.Data;
using BusTicketBooking.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusTicketBooking.DTOs;

namespace BusTicketBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BusController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BusController(ApplicationDbContext context)
        {
            _context = context;
        }


        [HttpGet("search")]
        public async Task<IActionResult> SearchBuses(
            [FromQuery] string source,
            [FromQuery] string destination,
            [FromQuery] DateTime date)
        {
            var buses = await _context.Buses
                .Where(b =>
                    b.Source.ToLower() == source.ToLower() &&
                    b.Destination.ToLower() == destination.ToLower() &&
                    b.DepartureTime.Date == date.Date)
                .Select(b => new
                {
                    b.BusId,
                    b.BusName,
                    b.BusNumber,
                    b.Source,
                    b.Destination,
                    b.DepartureTime,
                    b.TicketPrice,
                    AvailableSeats = b.Seats.Count(s => s.IsAvailable)
                })
                .ToListAsync();

            return Ok(buses);
        }

        // POST: api/bus


        [HttpPost]
        public async Task<IActionResult> CreateBus(CreateBusRequest request)
        {
            var bus = new Bus
            {
                BusId = Guid.NewGuid(),
                BusName = request.BusName,
                BusNumber = request.BusNumber,
                Source = request.Source,
                Destination = request.Destination,
                DepartureTime = request.DepartureTime,
                TicketPrice = request.TicketPrice,
                TotalSeats = 40,
                Seats = new List<Seat>()
            };

            for (int i = 0; i < 10; i++)
            {
                char row = (char)('A' + i);

                for (int seatNumber = 1; seatNumber <= 4; seatNumber++)
                {
                    bus.Seats.Add(new Seat
                    {
                        SeatId = Guid.NewGuid(),
                        BusId = bus.BusId,
                        SeatNumber = $"{row}{seatNumber}",
                        IsAvailable = true
                    });
                }
            }

            _context.Buses.Add(bus);
            await _context.SaveChangesAsync();

            return Ok(bus);
        }



        // GET: api/bus
        [HttpGet]
        public async Task<IActionResult> GetBuses()
        {
            var buses = await _context.Buses
                .Include(b => b.Seats)
                .AsNoTracking()
                .ToListAsync();

            return Ok(buses);
        }

        // PUT: api/bus/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateBuses(
            Guid id, Bus updatedBus)
        {
            var bus = await _context.Buses
                .FirstOrDefaultAsync(b => b.BusId == id);

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            bus.BusName = updatedBus.BusName;
            bus.BusNumber = updatedBus.BusNumber;

            await _context.SaveChangesAsync();

            return Ok(bus);
        }

        // DELETE: api/bus/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteBus(Guid id)
        {
            var bus = await _context.Buses
                .Include(b => b.Seats)
                .FirstOrDefaultAsync(b => b.BusId == id);

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            _context.Buses.Remove(bus);
            await _context.SaveChangesAsync();

            return Ok("Bus deleted successfully.");
        }
    }
}
