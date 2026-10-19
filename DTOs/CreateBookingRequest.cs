using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace BusTicketBooking.DTOs
{
    public class CreateBookingRequest
    {
        [Required]
        public string PassengerName { get; set; } = string.Empty;

        [Required]
        public Guid BusId { get; set; }

        [Required]
        public string SeatNumber { get; set; } = string.Empty;

        // [Range(0.01, 1000000)]
        // public decimal TotalPrice { get; set; }
    }
}