using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BusTicketBooking.Models
{
    public class Bus
    {
        public Guid BusId {get; set;}
        public string BusName {get; set;}
        public string BusNumber {get; set;}
        public int TotalSeat {get; set;} = 40;
        public List<Seat> Seats { get; set; } = new();

    }
}