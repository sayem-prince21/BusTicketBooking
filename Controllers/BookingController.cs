
using System;
using System.Collections.Generic;
using System.Linq;
using BusTicketBooking.Models;
using Microsoft.AspNetCore.Mvc;

namespace BusTicketBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private static List<Booking> bookings = new();

        // POST: /api/booking
        [HttpPost]
        public IActionResult CreateBooking(Booking booking)
        {
            // Find the selected bus
            var bus = BusController.buses
                .FirstOrDefault(b => b.BusId == booking.BusId);

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            // Find a seat by its number, such as A1 or B1
            var seat = bus.Seats.FirstOrDefault(s =>
                s.SeatNumber.Equals(
                    booking.SeatNumber,
                    StringComparison.OrdinalIgnoreCase
                ));

            if (seat == null)
            {
                return NotFound("Seat not found in this bus.");
            }

            // Check whether the seat is available
            if (!seat.IsAvailable)
            {
                return BadRequest("This seat is already booked.");
            }

            // Mark the seat as booked
            seat.IsAvailable = false;

            // Create the booking
            booking.BookingId = Guid.NewGuid();
            booking.SeatId = seat.SeatId;
            booking.BookingDate = DateTime.UtcNow;
            booking.Status = "Confirmed";

            bookings.Add(booking);

            return Ok(new
            {
                Message = "Seat booked successfully.",
                Booking = booking,
                SeatNumber = seat.SeatNumber,
                IsAvailable = seat.IsAvailable
            });
        }
    }
}