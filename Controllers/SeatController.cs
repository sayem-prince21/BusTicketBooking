
using BusTicketBooking.Data;
using BusTicketBooking.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusTicketBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SeatController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/seat/bus/{busId}
        [HttpGet("bus/{busId:guid}")]
        public async Task<IActionResult> GetSeatsByBus(Guid busId)
        {
            var busExists = await _context.Buses
                .AnyAsync(b => b.BusId == busId);

            if (!busExists)
            {
                return NotFound("Bus not found.");
            }

            var seats = await _context.Seats
                .Where(s => s.BusId == busId)
                .AsNoTracking()
                .ToListAsync();

            return Ok(seats);
        }

        // GET: api/seat/bus/{busId}/{seatNumber}
        [HttpGet("bus/{busId:guid}/{seatNumber}")]
        public async Task<IActionResult> GetSeat(
            Guid busId, string seatNumber)
        {
            var busExists = await _context.Buses
                .AnyAsync(b => b.BusId == busId);

            if (!busExists)
            {
                return NotFound("Bus not found.");
            }

            var seat = await _context.Seats
                .AsNoTracking()
                .FirstOrDefaultAsync(s =>
                    s.BusId == busId &&
                    s.SeatNumber.ToUpper() == seatNumber.ToUpper());

            if (seat == null)
            {
                return NotFound("Seat not found.");
            }

            return Ok(seat);
        }

        // POST: api/seat/bus/{busId}/{seatNumber}/book
        [HttpPost("bus/{busId:guid}/{seatNumber}/book")]
        public async Task<IActionResult> BookSeat(
            Guid busId, string seatNumber)
        {
            var seat = await _context.Seats
                .FirstOrDefaultAsync(s =>
                    s.BusId == busId &&
                    s.SeatNumber.ToUpper() == seatNumber.ToUpper());

            if (seat == null)
            {
                var busExists = await _context.Buses
                    .AnyAsync(b => b.BusId == busId);

                if (!busExists)
                {
                    return NotFound("Bus not found.");
                }

                return NotFound("Seat not found.");
            }

            if (!seat.IsAvailable)
            {
                return BadRequest("Seat is already booked.");
            }

            seat.IsAvailable = false;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Seat booked successfully.",
                SeatNumber = seat.SeatNumber,
                IsAvailable = seat.IsAvailable
            });
        }

        // PUT: api/seat/bus/{busId}/{seatNumber}/cancel
        [HttpPut("bus/{busId:guid}/{seatNumber}/cancel")]
        public async Task<IActionResult> CancelSeat(
            Guid busId, string seatNumber)
        {
            var seat = await _context.Seats
                .FirstOrDefaultAsync(s =>
                    s.BusId == busId &&
                    s.SeatNumber.ToUpper() == seatNumber.ToUpper());

            if (seat == null)
            {
                var busExists = await _context.Buses
                    .AnyAsync(b => b.BusId == busId);

                if (!busExists)
                {
                    return NotFound("Bus not found.");
                }

                return NotFound("Seat not found.");
            }

            if (seat.IsAvailable)
            {
                return BadRequest("Seat is already available.");
            }

            seat.IsAvailable = true;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Seat booking cancelled successfully.",
                SeatNumber = seat.SeatNumber,
                IsAvailable = seat.IsAvailable
            });
        }

        // GET: api/seat/bus/{busId}/available
        [HttpGet("bus/{busId:guid}/available")]
        public async Task<IActionResult> GetAvailableSeats(Guid busId)
        {
            var busExists = await _context.Buses
                .AnyAsync(b => b.BusId == busId);

            if (!busExists)
            {
                return NotFound("Bus not found.");
            }

            var seats = await _context.Seats
                .Where(s => s.BusId == busId && s.IsAvailable)
                .AsNoTracking()
                .ToListAsync();

            return Ok(seats);
        }

        // GET: api/seat/bus/{busId}/booked
        [HttpGet("bus/{busId:guid}/booked")]
        public async Task<IActionResult> GetBookedSeats(Guid busId)
        {
            var busExists = await _context.Buses
                .AnyAsync(b => b.BusId == busId);

            if (!busExists)
            {
                return NotFound("Bus not found.");
            }

            var seats = await _context.Seats
                .Where(s => s.BusId == busId && !s.IsAvailable)
                .AsNoTracking()
                .ToListAsync();

            return Ok(seats);
        }
    }
}
