using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace BusTicketBooking.DTOs
{
    public class CreateBusRequest
    {
        [Required]
        public string BusName { get; set; } = string.Empty;

        [Required]
        public string BusNumber { get; set; } = string.Empty;

        [Required]
        public string Source { get; set; } = string.Empty;

        [Required]
        public string Destination { get; set; } = string.Empty;

        [Required]
        [CustomValidation(typeof(CreateBusRequest), nameof(ValidateDepartureTime))]
        public DateTime DepartureTime { get; set; }

        public static ValidationResult? ValidateDepartureTime(DateTime departureTime, ValidationContext context)
        {
            if (departureTime <= DateTime.Now)
            {
                return new ValidationResult("Departure time must be in the future.");
            }

            return ValidationResult.Success;
        }

        [Range(0.01, 1000000)]
        public decimal TicketPrice { get; set; }
    }
}