using System;
using System.Linq;
using BusTicketBooking.Models;
using Microsoft.AspNetCore.Mvc;

namespace BusTicketBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeatController : ControllerBase
    {
        // Get all seats of a specific bus
        // GET: /api/seat/bus/{busId}
        [HttpGet("bus/{busId:guid}")]
        public IActionResult GetSeatsByBus(Guid busId)
        {
            var bus = BusController.buses
                .FirstOrDefault(b => b.BusId == busId);

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            return Ok(bus.Seats);
        }


        // Get a specific seat
        // GET: /api/seat/bus/{busId}/{seatNumber}
        [HttpGet("bus/{busId:guid}/{seatNumber}")]
        public IActionResult GetSeat(Guid busId, string seatNumber)
        {
            var bus = BusController.buses
                .FirstOrDefault(b => b.BusId == busId);

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            var seat = bus.Seats
                .FirstOrDefault(s =>
                    s.SeatNumber.Equals(
                        seatNumber,
                        StringComparison.OrdinalIgnoreCase
                    ));

            if (seat == null)
            {
                return NotFound("Seat not found.");
            }

            return Ok(seat);
        }


        // Book a seat
        // POST: /api/seat/bus/{busId}/{seatNumber}/book
        [HttpPost("bus/{busId:guid}/{seatNumber}/book")]
        public IActionResult BookSeat(Guid busId, string seatNumber)
        {
            var bus = BusController.buses
                .FirstOrDefault(b => b.BusId == busId);

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            var seat = bus.Seats
                .FirstOrDefault(s =>
                    s.SeatNumber.Equals(
                        seatNumber,
                        StringComparison.OrdinalIgnoreCase
                    ));

            if (seat == null)
            {
                return NotFound("Seat not found.");
            }

            if (!seat.IsAvailable)
            {
                return BadRequest("Seat is already booked.");
            }

            seat.IsAvailable = false;

            return Ok(new
            {
                Message = "Seat booked successfully.",
                SeatNumber = seat.SeatNumber,
                IsAvailable = seat.IsAvailable
            });
        }


        // Cancel a seat booking
        // PUT: /api/seat/bus/{busId}/{seatNumber}/cancel
        [HttpPut("bus/{busId:guid}/{seatNumber}/cancel")]
        public IActionResult CancelSeat(Guid busId, string seatNumber)
        {
            var bus = BusController.buses
                .FirstOrDefault(b => b.BusId == busId);

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            var seat = bus.Seats
                .FirstOrDefault(s =>
                    s.SeatNumber.Equals(
                        seatNumber,
                        StringComparison.OrdinalIgnoreCase
                    ));

            if (seat == null)
            {
                return NotFound("Seat not found.");
            }

            if (seat.IsAvailable)
            {
                return BadRequest("Seat is already available.");
            }

            seat.IsAvailable = true;

            return Ok(new
            {
                Message = "Seat booking cancelled successfully.",
                SeatNumber = seat.SeatNumber,
                IsAvailable = seat.IsAvailable
            });
        }


        // Get all available seats
        // GET: /api/seat/bus/{busId}/available
        [HttpGet("bus/{busId:guid}/available")]
        public IActionResult GetAvailableSeats(Guid busId)
        {
            var bus = BusController.buses
                .FirstOrDefault(b => b.BusId == busId);

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            var availableSeats = bus.Seats
                .Where(s => s.IsAvailable)
                .ToList();

            return Ok(availableSeats);
        }


        // Get all booked seats
        // GET: /api/seat/bus/{busId}/booked
        [HttpGet("bus/{busId:guid}/booked")]
        public IActionResult GetBookedSeats(Guid busId)
        {
            var bus = BusController.buses
                .FirstOrDefault(b => b.BusId == busId);

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            var bookedSeats = bus.Seats
                .Where(s => !s.IsAvailable)
                .ToList();

            return Ok(bookedSeats);
        }
    }
}