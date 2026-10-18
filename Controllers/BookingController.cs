
using BusTicketBooking.Data;
using BusTicketBooking.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusTicketBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BookingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/booking

        [HttpPost]
        public async Task<IActionResult> CreateBooking(Booking booking)
        {
            if (string.IsNullOrWhiteSpace(booking.PassengerName))
            {
                return BadRequest("Passenger name is required.");
            }

            if (booking.TotalPrice <= 0)
            {
                return BadRequest("Ticket price must be greater than zero.");
            }

            if (string.IsNullOrWhiteSpace(booking.SeatNumber))
            {
                return BadRequest("Seat number is required.");
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                // Check that the bus exists
                var busExists = await _context.Buses
                    .AnyAsync(b => b.BusId == booking.BusId);

                if (!busExists)
                {
                    return NotFound("Bus not found.");
                }

                // Find the requested seat on this bus
                var seat = await _context.Seats
                    .FirstOrDefaultAsync(s =>
                        s.BusId == booking.BusId &&
                        s.SeatNumber.ToUpper() ==
                        booking.SeatNumber.ToUpper());

                if (seat == null)
                {
                    return NotFound("Seat not found in this bus.");
                }

                // Atomic reservation: only one request can change
                // this seat from available to booked successfully.

                var affectedRows = await _context.Database
                    .ExecuteSqlInterpolatedAsync(
                        $"UPDATE Seats SET IsAvailable = 0 WHERE SeatId = {seat.SeatId} AND IsAvailable = 1");


                if (affectedRows != 1)
                {
                    await transaction.RollbackAsync();

                    return Conflict("This seat has already been booked.");
                }

                // Keep the tracked entity consistent with the database
                seat.IsAvailable = false;

                // Create the booking
                booking.BookingId = Guid.NewGuid();
                booking.SeatId = seat.SeatId;
                booking.SeatNumber = seat.SeatNumber;
                booking.BookingDate = DateTime.UtcNow;
                booking.Status = "Confirmed";

                // Prevent client-supplied navigation objects being saved
                booking.Bus = null;
                booking.Seat = null;

                _context.Bookings.Add(booking);

                // Save the booking and commit the reservation together
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    Message = "Seat booked successfully.",
                    Booking = booking,
                    SeatNumber = seat.SeatNumber,
                    IsAvailable = seat.IsAvailable
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // GET: api/booking
        [HttpGet]
        public async Task<IActionResult> GetAllBooking()
        {
            var bookings = await _context.Bookings
                .AsNoTracking()
                .ToListAsync();

            return Ok(bookings);
        }

        // GET: api/booking/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetBookingById(Guid id)
        {
            var booking = await _context.Bookings
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.BookingId == id);

            if (booking == null)
            {
                return NotFound("Booking not found.");
            }

            return Ok(booking);
        }

        // DELETE: api/booking/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> CancelBookingById(Guid id)
        {
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.BookingId == id);

            if (booking == null)
            {
                return NotFound("Booking not found.");
            }

            if (booking.Status == "Cancelled")
            {
                return BadRequest("This booking is already cancelled.");
            }

            var seat = await _context.Seats
                .FirstOrDefaultAsync(s => s.SeatId == booking.SeatId);

            if (seat == null)
            {
                return NotFound("Seat not found.");
            }

            // Cancel booking and release the seat
            booking.Status = "Cancelled";
            seat.IsAvailable = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Booking cancelled successfully.",
                BookingId = booking.BookingId,
                SeatNumber = seat.SeatNumber,
                BookingStatus = booking.Status,
                IsSeatAvailable = seat.IsAvailable
            });
        }
    }
}
