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
        private static List<Bus> buses = new List<Bus>();

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
    }
}