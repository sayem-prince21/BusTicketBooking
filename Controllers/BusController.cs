using System;
using System.Collections.Generic;
using BusTicketBooking.Models;
using Microsoft.AspNetCore.Mvc;

namespace BusTicketBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BusController : ControllerBase
    {
        public static List<Bus> buses = new List<Bus>();

        [HttpPost]
        public IActionResult CreateBus(Bus bus)
        {
            bus.BusId = Guid.NewGuid();

            bus.TotalSeats = 40;

            for (int i = 0; i < 10; i++)
            {
                char row = (char)('A' + i);

                for (int seatNumber = 1; seatNumber <= 4; seatNumber++)
                {
                    bus.Seats.Add(new Seat
                    {
                        SeatId = Guid.NewGuid(),
                        SeatNumber = $"{row}{seatNumber}",
                        IsAvailable = true
                    });
                }
            }

            buses.Add(bus);

            return Ok(bus);
        }

        [HttpGet]
        public IActionResult GetBuses()
        {
            return Ok(buses);
        }

        [HttpPut("{id:guid}")]
        public IActionResult UpdateBuses(Guid id, Bus updatedBus)
        {
            var bus = buses.FirstOrDefault(b => b.BusId == id);

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            bus.BusName = updatedBus.BusName;
            bus.BusNumber = updatedBus.BusNumber;

            return Ok(bus);
        }

        [HttpDelete("{id:guid}")]
        public IActionResult DeleteBus(Guid id)
        {
            var bus = buses.FirstOrDefault(b => b.BusId == id);

            if (bus == null)
            {
                return NotFound("Bus not found.");
            }

            buses.Remove(bus);

            return Ok("Bus deleted successfully.");
        }
    }
}