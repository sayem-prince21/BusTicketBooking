
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

        [HttpGet]
        public IActionResult GetAllBooking()
        {
            return Ok(bookings);
        }

        [HttpGet("{id:guid}")]
        public IActionResult GetBookingById(Guid id)
        {
             var booking = bookings.FirstOrDefault(
                b => b.BookingId == id
            );

            if (booking == null)
            {
                return NotFound("Booking not found.");
            }

            return Ok(booking);
        }

        [HttpDelete("{id:guid}")]
        public IActionResult CancelBookingById(Guid id)
        {
            // Find the booking
            var booking = bookings.FirstOrDefault(
                b => b.BookingId == id
            );

            if (booking == null)
            {
                return NotFound("Booking not found.");
            }

            // Prevent cancelling an already cancelled booking
            if (booking.Status == "Cancelled")
            {
                return BadRequest("This booking is already cancelled.");
            }

            // Find the bus
            var bus = BusController.buses.FirstOrDefault(
                b => b.BusId == booking.BusId
            );

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            // Find the seat
            var seat = bus.Seats.FirstOrDefault(
                s => s.SeatId == booking.SeatId
            );

            if (seat == null)
            {
                return NotFound("Seat not found.");
            }

            // Cancel the booking and release the seat
            booking.Status = "Cancelled";
            seat.IsAvailable = true;

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