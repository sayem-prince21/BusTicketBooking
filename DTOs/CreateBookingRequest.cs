
using System;
using System.ComponentModel.DataAnnotations;

namespace BusTicketBooking.DTOs
{
    public class CreateBookingRequest
    {
        [Required]
        [StringLength(100)]
        public string PassengerName { get; set; } = string.Empty;

        [Required]
        [Phone]
        [StringLength(20)]
        public string PassengerPhone { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(254)]
        public string PassengerEmail { get; set; } = string.Empty;

        [Required]
        public Guid BusId { get; set; }

        [Required]
        [StringLength(10)]
        public string SeatNumber { get; set; } = string.Empty;
    }
}
