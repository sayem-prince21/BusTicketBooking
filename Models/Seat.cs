
using System.Text.Json.Serialization;

namespace BusTicketBooking.Models
{
    public class Seat
    {
        public Guid SeatId { get; set; }

        public Guid BusId { get; set; }

        public string SeatNumber { get; set; } = string.Empty;

        public bool IsAvailable { get; set; } = true;

        [JsonIgnore]
        public Bus? Bus { get; set; }
    }
}
