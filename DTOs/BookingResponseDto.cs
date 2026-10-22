using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BusTicketBooking.DTOs
{
    public class BookingResponseDto
    {
        public Guid BookingId { get; set; }

        public string PassengerName { get; set; } = string.Empty;
        public string PassengerPhone { get; set; } = string.Empty;

        public string PassengerEmail { get; set; } = string.Empty;

        public string BusName { get; set; } = string.Empty;

        public string BusNumber { get; set; } = string.Empty;

        public string Source { get; set; } = string.Empty;
        public DateTime DepartureTime { get; set; }

        public string Destination { get; set; } = string.Empty;

        public string SeatNumber { get; set; } = string.Empty;

        public decimal TotalPrice { get; set; }

        public string Status { get; set; } = string.Empty;
    }
}