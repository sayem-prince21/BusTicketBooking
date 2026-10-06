using System.ComponentModel.DataAnnotations;

namespace BusTicketBooking.Models
{
    public class UpdateTicketRequest
    {
        [Required]
        public string PassengerName { get; set; } = string.Empty;

        [Required]
        public string SeatNumber { get; set; } = string.Empty;

        [Range(0.01, double.MaxValue)]
        public decimal TicketPrice { get; set; }

        public bool SeatAvailable { get; set; } = true;
    }
}
