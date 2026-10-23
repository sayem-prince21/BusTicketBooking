
using BusTicketBooking.Data;
using BusTicketBooking.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using BusTicketBooking.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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
        public async Task<IActionResult> CreateBooking(
        [FromBody] CreateBookingRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.PassengerName))
            {
                return BadRequest("Passenger name is required.");
            }

            if (string.IsNullOrWhiteSpace(request.PassengerPhone))
            {
                return BadRequest("Passenger phone is required.");
            }

            if (string.IsNullOrWhiteSpace(request.PassengerEmail))
            {
                return BadRequest("Passenger email is required.");
            }

            if (request.BusId == Guid.Empty)
            {
                return BadRequest("A valid bus ID is required.");
            }

            if (string.IsNullOrWhiteSpace(request.SeatNumber))
            {
                return BadRequest("Seat number is required.");
            }

            // Logged-in users are associated with their account.
            // Guest users can book without an account.
            var userId = User.Identity?.IsAuthenticated == true
                ? User.FindFirstValue(ClaimTypes.NameIdentifier)
                : null;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var bus = await _context.Buses
                    .FirstOrDefaultAsync(b => b.BusId == request.BusId);

                if (bus == null)
                {
                    return NotFound("Bus not found.");
                }

                if (bus.TicketPrice <= 0)
                {
                    return BadRequest("This bus has an invalid ticket price.");
                }

                var seat = await _context.Seats
                    .FirstOrDefaultAsync(s =>
                        s.BusId == request.BusId &&
                        s.SeatNumber.ToUpper() ==
                        request.SeatNumber.Trim().ToUpper());

                if (seat == null)
                {
                    return NotFound("Seat not found in this bus.");
                }

                var affectedRows = await _context.Database
                    .ExecuteSqlInterpolatedAsync(
                        $"UPDATE Seats SET IsAvailable = 0 WHERE SeatId = {seat.SeatId} AND IsAvailable = 1");

                if (affectedRows != 1)
                {
                    await transaction.RollbackAsync();
                    return Conflict("This seat has already been booked.");
                }

                seat.IsAvailable = false;


                var booking = new Booking

                {

                    BookingId = Guid.NewGuid(),
                    PassengerName = request.PassengerName.Trim(),
                    PassengerPhone = request.PassengerPhone.Trim(),
                    PassengerEmail = request.PassengerEmail.Trim(),
                    BusId = request.BusId,
                    SeatId = seat.SeatId,
                    SeatNumber = seat.SeatNumber,
                    BookingDate = DateTime.UtcNow,
                    TotalPrice = bus.TicketPrice,
                    Status = "Confirmed",
                    UserId = userId
                };

                _context.Bookings.Add(booking);

                await _context.SaveChangesAsync();


                var ticket = new Ticket
                {
                    TicketId = Guid.NewGuid(),
                    BookingId = booking.BookingId,
                    PassengerName = booking.PassengerName,
                    SeatNumber = booking.SeatNumber,
                    TicketPrice = booking.TotalPrice,
                    IssuedAt = DateTime.UtcNow,
                    SeatAvailable = false
                };

                _context.Tickets.Add(ticket);

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();




                var response = new BookingResponseDto
                {
                    BookingId = booking.BookingId,
                    PassengerName = booking.PassengerName,
                    PassengerPhone = booking.PassengerPhone,
                    PassengerEmail = booking.PassengerEmail,

                    BusName = bus.BusName,
                    BusNumber = bus.BusNumber,
                    Source = bus.Source,
                    Destination = bus.Destination,
                    DepartureTime = bus.DepartureTime,

                    SeatNumber = booking.SeatNumber,
                    TotalPrice = booking.TotalPrice,
                    Status = booking.Status
                };

                return Ok(new
                {
                    Message = "Seat booked successfully.",

                    Booking = response,

                    Ticket = new
                    {
                        TicketId = ticket.TicketId,
                        BookingId = ticket.BookingId,
                        PassengerName = ticket.PassengerName,
                        PassengerPhone = booking.PassengerPhone,
                        PassengerEmail = booking.PassengerEmail,
                        BusName = bus.BusName,
                        BusNumber = bus.BusNumber,
                        Source = bus.Source,
                        Destination = bus.Destination,
                        DepartureTime = bus.DepartureTime,
                        SeatNumber = ticket.SeatNumber,
                        TicketPrice = ticket.TicketPrice,
                        IssuedAt = ticket.IssuedAt,
                        Status = booking.Status
                    }
                });


            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }



        // GET: api/booking
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAllBooking()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");
            var bookingsQuery = _context.Bookings.AsNoTracking();

            if (!isAdmin)
            {
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                bookingsQuery = bookingsQuery.Where(b => b.UserId == userId);
            }

            var bookings = await bookingsQuery
                .Select(b => new BookingResponseDto
                {
                    BookingId = b.BookingId,
                    PassengerName = b.PassengerName,
                    BusName = b.Bus != null ? b.Bus.BusName : "Unknown Bus",
                    BusNumber = b.Bus != null ? b.Bus.BusNumber : "Unknown",
                    Source = b.Bus != null ? b.Bus.Source : "Unknown",
                    DepartureTime = b.Bus != null ? b.Bus.DepartureTime : default,
                    Destination = b.Bus != null ? b.Bus.Destination : "Unknown",
                    SeatNumber = b.SeatNumber,
                    TotalPrice = b.TotalPrice,
                    Status = b.Status
                })
                .ToListAsync();

            return Ok(bookings);
        }


        // GET: api/booking/{id}
        // GET: api/booking/{id}
        [Authorize]
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetBookingById(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");
            var bookingQuery = _context.Bookings
                .AsNoTracking()
                .Where(b => b.BookingId == id);

            if (!isAdmin)
            {
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                bookingQuery = bookingQuery.Where(b => b.UserId == userId);
            }

            var booking = await bookingQuery
                .Select(b => new BookingResponseDto
                {
                    BookingId = b.BookingId,
                    PassengerName = b.PassengerName,
                    BusName = b.Bus != null ? b.Bus.BusName : "Unknown Bus",
                    BusNumber = b.Bus != null ? b.Bus.BusNumber : "Unknown",
                    Source = b.Bus != null ? b.Bus.Source : "Unknown",
                    DepartureTime = b.Bus != null ? b.Bus.DepartureTime : default,
                    Destination = b.Bus != null ? b.Bus.Destination : "Unknown",
                    SeatNumber = b.SeatNumber,
                    TotalPrice = b.TotalPrice,
                    Status = b.Status
                })
                .FirstOrDefaultAsync();

            if (booking == null)
            {
                return NotFound("Booking not found.");
            }

            return Ok(booking);
        }


        // DELETE: api/booking/{id}
        [Authorize]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> CancelBookingById(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            if (!isAdmin && string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            // Find the booking before opening a transaction.
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.BookingId == id);

            if (booking == null ||
                (!isAdmin && booking.UserId != userId))
            {
                return NotFound("Booking not found.");
            }

            if (booking.Status == "Cancelled")
            {
                return BadRequest("This booking is already cancelled.");
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                // Recheck the seat inside the transaction.
                var seat = await _context.Seats
                    .FirstOrDefaultAsync(s => s.SeatId == booking.SeatId);

                if (seat == null)
                {
                    await transaction.RollbackAsync();
                    return NotFound("Seat not found.");
                }

                booking.Status = "Cancelled";
                seat.IsAvailable = true;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    Message = "Booking cancelled successfully.",
                    BookingId = booking.BookingId,
                    SeatNumber = seat.SeatNumber,
                    BookingStatus = booking.Status,
                    IsSeatAvailable = seat.IsAvailable
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }




        [Authorize]
        [HttpGet("confirmed")]
        public async Task<IActionResult> GetConfirmedBookings()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var bookingsQuery = _context.Bookings
                .AsNoTracking()
                .Where(b => b.Status == "Confirmed");

            if (!isAdmin)
            {
                bookingsQuery = bookingsQuery.Where(b => b.UserId == userId);
            }

            var bookings = await bookingsQuery
                .Select(b => new BookingResponseDto
                {
                    BookingId = b.BookingId,
                    PassengerName = b.PassengerName,
                    BusName = b.Bus != null ? b.Bus.BusName : "Unknown Bus",
                    BusNumber = b.Bus != null ? b.Bus.BusNumber : "Unknown",
                    Source = b.Bus != null ? b.Bus.Source : "Unknown",
                    DepartureTime = b.Bus != null ? b.Bus.DepartureTime : default,
                    Destination = b.Bus != null ? b.Bus.Destination : "Unknown",
                    SeatNumber = b.SeatNumber,
                    TotalPrice = b.TotalPrice,
                    Status = b.Status
                })
                .ToListAsync();

            return Ok(bookings);
        }



        [Authorize]
        [HttpGet("cancelled")]
        public async Task<IActionResult> GetCancelledBookings()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var bookingsQuery = _context.Bookings
                .AsNoTracking()
                .Where(b => b.Status == "Cancelled");

            if (!isAdmin)
            {
                bookingsQuery = bookingsQuery.Where(b => b.UserId == userId);
            }

            var bookings = await bookingsQuery
                .Select(b => new BookingResponseDto
                {
                    BookingId = b.BookingId,
                    PassengerName = b.PassengerName,
                    BusName = b.Bus != null ? b.Bus.BusName : "Unknown Bus",
                    BusNumber = b.Bus != null ? b.Bus.BusNumber : "Unknown",
                    Source = b.Bus != null ? b.Bus.Source : "Unknown",
                    DepartureTime = b.Bus != null ? b.Bus.DepartureTime : default,
                    Destination = b.Bus != null ? b.Bus.Destination : "Unknown",
                    SeatNumber = b.SeatNumber,
                    TotalPrice = b.TotalPrice,
                    Status = b.Status
                })
                .ToListAsync();

            return Ok(bookings);
        }


    }
}
