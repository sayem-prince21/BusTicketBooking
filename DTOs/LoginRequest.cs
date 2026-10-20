using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace BusTicketBooking.DTOs
{
    public class LoginRequest
    {
        // User can provide either email or phone number.
        public string? Email { get; set; }

        public string? PhoneNumber { get; set; }

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
