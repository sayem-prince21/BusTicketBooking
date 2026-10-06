using BusTicketBooking.Models;

namespace BusTicketBooking.Services
{
    public class TicketService
    {
        private readonly List<Ticket> _tickets = new();
        private readonly object _lock = new();

        public IReadOnlyList<Ticket> GetAll()
        {
            lock (_lock)
            {
                return _tickets.ToList();
            }
        }

        public Ticket? GetById(Guid id)
        {
            lock (_lock)
            {
                return _tickets.FirstOrDefault(t => t.TicketId == id);
            }
        }

        public Ticket? Update(Guid id, string passengerName, string seatNumber, decimal ticketPrice, bool seatAvailable)
        {
            lock (_lock)
            {
                var ticket = _tickets.FirstOrDefault(t => t.TicketId == id);
                if (ticket is null)
                {
                    return null;
                }

                ticket.PassengerName = passengerName;
                ticket.SeatNumber = seatNumber;
                ticket.TicketPrice = ticketPrice;
                ticket.SeatAvailable = seatAvailable;

                return ticket;
            }
        }

        public bool Delete(Guid id)
        {
            lock (_lock)
            {
                var ticket = _tickets.FirstOrDefault(t => t.TicketId == id);
                if (ticket is null)
                {
                    return false;
                }

                _tickets.Remove(ticket);
                return true;
            }
        }

        public Ticket Create(string passengerName, string seatNumber, decimal ticketPrice)
        {
            var ticket = new Ticket
            {
                TicketId = Guid.NewGuid(),
                PassengerName = passengerName,
                SeatNumber = seatNumber,
                TicketPrice = ticketPrice,
                IssuedAt = DateTime.UtcNow,
                SeatAvailable = true
            };

            lock (_lock)
            {
                _tickets.Add(ticket);
            }

            return ticket;
        }
    }
}
