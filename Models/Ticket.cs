using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BusTicketBooking.Models
{
    public class Ticket
    {
        public Guid TicketId { get; set; }

        public string PassengerName { get; set; } = string.Empty;

        public string SeatNumber { get; set; } = string.Empty;

        public decimal TicketPrice { get; set; }

        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

        public bool SeatAvailable { get; set; } = true;

        // Link this ticket to its booking.
        public Guid BookingId { get; set; }

        public Booking? Booking { get; set; }

        public string Status { get; set; } = "Confirmed";
    }
}

