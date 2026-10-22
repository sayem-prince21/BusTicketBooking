
using System;
using BusTicketBooking.Models;
using System.ComponentModel.DataAnnotations;

namespace BusTicketBooking.Models
{
    public class Booking
    {
        public Guid BookingId { get; set; }

        public string PassengerName { get; set; } = string.Empty;
        [Required]
        [Phone]
        [StringLength(20)]
        public string PassengerPhone { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(254)]
        public string PassengerEmail { get; set; } = string.Empty;


        public Guid BusId { get; set; }

        public Guid SeatId { get; set; }

        public string SeatNumber { get; set; } = string.Empty;

        public DateTime BookingDate { get; set; } = DateTime.UtcNow;

        public decimal TotalPrice { get; set; }

        public string Status { get; set; } = "Confirmed";

        // Identity user who created this booking.
        // Nullable initially to preserve existing bookings.
        public string? UserId { get; set; }

        // Navigation property for the associated user.
        public ApplicationUser? User { get; set; }

        // Existing navigation properties.
        public Bus? Bus { get; set; }

        public Seat? Seat { get; set; }
    }
}
