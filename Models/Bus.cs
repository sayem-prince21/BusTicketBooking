using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BusTicketBooking.Models
{
    public class Bus
    {
        public Guid BusId {get; set;}
        public string BusName {get; set;}=string.Empty;
        public string BusNumber {get; set;}=string.Empty;
        public int TotalSeats {get; set;} = 40;
        public List<Seat> Seats { get; set; } = new();

    }
}