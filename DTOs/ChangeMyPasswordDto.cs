using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;

namespace BusTicketBooking.DTOs
{
    public class ChangeMyPasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [StringLength(
            100,
            MinimumLength = 8,
            ErrorMessage = "The new password must be at least 8 characters long."
        )]
        public string NewPassword { get; set; } = string.Empty;
    }
}