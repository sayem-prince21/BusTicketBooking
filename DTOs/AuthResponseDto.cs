using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


namespace BusTicketBooking.DTOs
{
    // Defines the response returned after successful authentication.
    public class AuthResponseDto
    {
        // JWT token used to access protected API endpoints.
        public string Token { get; set; } = string.Empty;

        // Basic information about the authenticated user.
        public string UserId { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        // Token expiration time in UTC.
        public DateTime ExpiresAt { get; set; }
    }
}
