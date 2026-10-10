using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BusTicketBooking.Models
{
    public class Booking
    {
        public Guid BookingId { get; set; }

        public string PassengerName { get; set; } = string.Empty;

        public Guid BusId { get; set; }

        public Guid SeatId { get; set; }
        public string SeatNumber { get; set; } = string.Empty;

        public DateTime BookingDate { get; set; } = DateTime.UtcNow;

        public decimal TotalPrice { get; set; }

        public string Status { get; set; } = "Confirmed";
    }
}