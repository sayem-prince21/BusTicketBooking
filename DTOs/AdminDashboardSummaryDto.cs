using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


namespace BusTicketBooking.DTOs
{
    public class AdminDashboardSummaryDto
    {
        public int TotalCustomers { get; set; }

        public int TotalBookings { get; set; }

        public int ConfirmedBookings { get; set; }

        public int CancelledBookings { get; set; }
    }
}
