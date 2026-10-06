using Microsoft.AspNetCore.Mvc;
using BusTicketBooking.Models;
using BusTicketBooking.Services;

namespace BusTicketBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketController : ControllerBase
    {
        private readonly TicketService _ticketService;

        public TicketController(TicketService ticketService)
        {
            _ticketService = ticketService;
        }

        // POST /api/ticket
        [HttpPost]
        public IActionResult CreateTicket([FromBody] CreateTicketRequest request)
        {
            var ticket = _ticketService.Create(
                request.PassengerName,
                request.SeatNumber,
                request.TicketPrice);

            return CreatedAtAction(
                nameof(GetTicketById),
                new { id = ticket.TicketId },
                ticket);
        }

        // GET /api/ticket  (all tickets)
        [HttpGet]
        public IActionResult GetTickets()
        {
            return Ok(_ticketService.GetAll());
        }

        // GET /api/ticket/{id}
        [HttpGet("{id:guid}")]
        public IActionResult GetTicketById(Guid id)
        {
            var ticket = _ticketService.GetById(id);
            if (ticket is null)
            {
                return NotFound(new { message = $"Ticket {id} not found." });
            }

            return Ok(ticket);
        }

        // PUT /api/ticket/{id}
        [HttpPut("{id:guid}")]
        public IActionResult UpdateTicket(Guid id, [FromBody] UpdateTicketRequest request)
        {
            var ticket = _ticketService.Update(
                id,
                request.PassengerName,
                request.SeatNumber,
                request.TicketPrice,
                request.SeatAvailable);

            if (ticket is null)
            {
                return NotFound(new { message = $"Ticket {id} not found." });
            }

            return Ok(ticket);
        }

        // DELETE /api/ticket/{id}
        [HttpDelete("{id:guid}")]
        public IActionResult DeleteTicket(Guid id)
        {
            var deleted = _ticketService.Delete(id);
            if (!deleted)
            {
                return NotFound(new { message = $"Ticket {id} not found." });
            }

            return NoContent();
        }
    }
}