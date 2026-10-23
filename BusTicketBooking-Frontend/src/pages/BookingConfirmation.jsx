import { useState } from 'react'
import { CheckCircle2, Home, Printer, Ticket, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import BookingSummary from '../components/BookingSummary.jsx'
import {
  formatFare,
  formatDateTime,
  formatJourneyDate,
  formatTime,
} from '../utils/format.js'

// Page 4: booking confirmation / ticket.
// Every value rendered here comes from the real POST /api/booking response
// that was saved by the guest booking page — nothing is invented.
function readRecord() {
  try {
    const raw = sessionStorage.getItem('btb.lastBooking')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function BookingConfirmation() {
  const [record] = useState(readRecord)

  if (!record) {
    return (
      <div className="section py-5">
        <div className="container">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <h1 className="h5">No booking to show</h1>
              <p className="text-muted mb-3">
                There is no booking result in this session. Search for a bus and
                complete a booking to see its confirmation here.
              </p>
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                <Link to="/search" className="btn btb-btn-brand">
                  Search buses
                </Link>
                <Link to="/" className="btn btn-outline-secondary">
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const booking = record.booking || {}
  const ticket = record.ticket || {}
  const journey = record.journey || {}
  const failed = record.status !== 'success'

  const bookingId = booking.bookingId
  const ticketId = ticket.ticketId
  const status = booking.Status || booking.status || (failed ? 'Failed' : 'Confirmed')

  return (
    <div className="section py-4 py-lg-5">
      <div className="container">
        <div className="text-center mb-4">
          {failed ? (
            <XCircle size={44} className="text-danger mb-2" aria-hidden="true" />
          ) : (
            <CheckCircle2 size={44} className="text-success mb-2" aria-hidden="true" />
          )}
          <h1 className="h3 mb-1">
            {failed ? 'Booking failed' : 'Booking confirmed!'}
          </h1>
          <p className="text-muted mb-0">
            {failed
              ? record.message || 'The booking could not be completed.'
              : record.message || 'Your seat has been booked.'}
          </p>
        </div>

        <div className="row justify-content-center g-4">
          <div className="col-12 col-lg-8">
            {/* Printable ticket */}
            <div className="card ticket-card border-0 shadow-sm" id="printable-ticket">
              <div className="card-header bg-primary text-white d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span className="d-flex align-items-center gap-2 fw-semibold">
                  <Ticket size={18} aria-hidden="true" />
                  BusTicketBooking Ticket
                </span>
                <span className={`badge ${status === 'Confirmed' ? 'text-bg-success' : 'text-bg-light'}`}>
                  {status}
                </span>
              </div>

              <div className="card-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-12 col-sm-6">
                    <div className="ticket-label">Booking reference</div>
                    <div className="ticket-value" data-testid="booking-id">
                      {bookingId || 'Not returned by the API'}
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="ticket-label">Ticket ID</div>
                    <div className="ticket-value" data-testid="ticket-id">
                      {ticketId || 'Not returned by the API'}
                    </div>
                  </div>
                </div>

                <BookingSummary
                  title="Journey details"
                  rows={[
                    { label: 'Passenger', value: booking.passengerName || '—', emphasize: true },
                    { label: 'Phone', value: booking.passengerPhone || ticket.passengerPhone || '—' },
                    { label: 'Email', value: booking.passengerEmail || ticket.passengerEmail || '—' },
                    {
                      label: 'Bus',
                      value: `${booking.busName || '—'} (${booking.busNumber || '—'})`,
                    },
                    { label: 'Origin', value: booking.source || journey.from || '—' },
                    { label: 'Destination', value: booking.destination || journey.to || '—' },
                    {
                      label: 'Journey date',
                      value: journey.date ? formatJourneyDate(journey.date) : '—',
                    },
                    {
                      label: 'Departure time',
                      value: booking.departureTime
                        ? formatTime(booking.departureTime)
                        : record.bus?.departureTime
                          ? formatTime(record.bus.departureTime)
                          : '—',
                    },
                    { label: 'Seat number', value: booking.seatNumber || '—', emphasize: true },
                    { label: 'Issued at', value: ticket.issuedAt ? formatDateTime(ticket.issuedAt) : '—' },
                  ]}
                  total={{
                    label: 'Total paid',
                    value: formatFare(booking.totalPrice ?? ticket.ticketPrice),
                  }}
                  footer="Payment processing is not part of this application; the amount shown is the fare recorded by the booking API."
                />
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4 print-hidden justify-content-center">
              <button
                type="button"
                className="btn btb-btn-brand"
                onClick={() => window.print()}
              >
                <Printer size={16} className="me-2" aria-hidden="true" />
                Print Ticket
              </button>
              <Link to="/" className="btn btn-outline-secondary">
                <Home size={16} className="me-2" aria-hidden="true" />
                Back to Home
              </Link>
              <Link to="/bookings" className="btn btn-outline-primary">
                <Ticket size={16} className="me-2" aria-hidden="true" />
                View My Bookings
              </Link>
            </div>

            <p className="small text-muted text-center mt-3 print-hidden">
              Booking and ticket IDs are shown exactly as returned by{' '}
              <code>POST /api/booking</code>. Guest bookings can only be listed
              after signing in with the account used to book.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
