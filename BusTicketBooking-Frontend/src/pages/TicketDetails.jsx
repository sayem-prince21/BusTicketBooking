import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Printer, Ticket, XCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import BookingSummary from '../components/BookingSummary.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { getErrorMessage } from '../services/api.js'
import { cancelBooking, getBooking } from '../services/bookingService.js'
import { formatDateTime, formatFare, formatTime } from '../utils/format.js'

function readTicketIds() {
  try {
    const raw = sessionStorage.getItem('btb.ticketIds')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Page 5 (part 5): ticket / booking details for one booking.
// GET /api/booking/{id} does not return a ticket ID, so the ID captured from
// the booking response is shown when available; otherwise the limitation is
// stated instead of inventing an identifier.
export default function TicketDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [booking, setBooking] = useState({ status: 'loading', data: null, error: null })
  const [showCancel, setShowCancel] = useState(false)
  const [action, setAction] = useState({ busy: false, error: null })

  // Ticket IDs are only returned by POST /api/booking, so the ID captured
  // during booking is looked up (sessionStorage) when it exists.
  const ticketId = readTicketIds()[id] || null

  const fetchBooking = useCallback(() => {
    getBooking(id)
      .then((data) => setBooking({ status: 'done', data, error: null }))
      .catch((error) => setBooking({ status: 'error', data: null, error: getErrorMessage(error) }))
  }, [id])

  const load = useCallback(() => {
    setBooking((current) => ({ ...current, status: 'loading' }))
    fetchBooking()
  }, [fetchBooking])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking, id])

  const handleCancel = async () => {
    if (action.busy) return
    setAction({ busy: true, error: null })

    try {
      await cancelBooking(id)
      setShowCancel(false)
      setAction({ busy: false, error: null })
      load()
    } catch (error) {
      setAction({ busy: false, error: getErrorMessage(error) })
    }
  }

  if (booking.status === 'loading') {
    return (
      <div className="section py-5">
        <div className="container">
          <LoadingState label="Loading booking…" />
        </div>
      </div>
    )
  }

  if (booking.status === 'error') {
    return (
      <div className="section py-5">
        <div className="container">
          <ErrorMessage title="Booking unavailable" message={booking.error} onRetry={load} />
          <div className="mt-3">
            <Link to="/bookings">← Back to my bookings</Link>
          </div>
        </div>
      </div>
    )
  }

  const data = booking.data
  const canCancel = data.status === 'Confirmed'

  return (
    <div className="section py-4 py-lg-5">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <button
              type="button"
              className="btn btn-sm btn-link px-0 mb-2"
              onClick={() => navigate('/bookings')}
            >
              <ArrowLeft size={14} className="me-1" aria-hidden="true" />
              Back to my bookings
            </button>
            <h1 className="h4 mb-1 d-flex align-items-center gap-2">
              <Ticket size={20} className="text-primary" aria-hidden="true" />
              Booking details
              <StatusBadge status={data.status} />
            </h1>
            <p className="text-muted small mb-0">
              Loaded from <code>GET /api/booking/{'{id}'}</code>
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2 print-hidden">
            <button type="button" className="btn btb-btn-brand" onClick={() => window.print()}>
              <Printer size={16} className="me-2" aria-hidden="true" />
              Print Ticket
            </button>
            {canCancel && (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => setShowCancel(true)}
              >
                <XCircle size={16} className="me-1" aria-hidden="true" />
                Cancel booking
              </button>
            )}
          </div>
        </div>

        {action.error && (
          <div className="mb-3">
            <ErrorMessage title="Action failed" message={action.error} />
          </div>
        )}

        <div className="row justify-content-center g-4">
          <div className="col-12 col-lg-8">
            <div className="card ticket-card border-0 shadow-sm" id="printable-ticket">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <span className="fw-semibold d-flex align-items-center gap-2">
                  <Ticket size={18} aria-hidden="true" />
                  BusTicketBooking Ticket
                </span>
                <span className="badge text-bg-light">{data.status}</span>
              </div>

              <div className="card-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-12 col-sm-6">
                    <div className="ticket-label">Booking reference</div>
                    <div className="ticket-value">{data.bookingId}</div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="ticket-label">Ticket ID</div>
                    <div className="ticket-value">
                      {ticketId || (
                        <span className="text-muted small">
                          Not included in GET /api/booking/{'{id}'} — shown after
                          booking when returned by POST /api/booking.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <BookingSummary
                  title="Journey details"
                  rows={[
                    { label: 'Passenger', value: data.passengerName || '—', emphasize: true },
                    { label: 'Bus', value: `${data.busName} (${data.busNumber})` },
                    { label: 'Origin', value: data.source },
                    { label: 'Destination', value: data.destination },
                    { label: 'Departure', value: formatDateTime(data.departureTime) },
                    { label: 'Departure time', value: formatTime(data.departureTime) },
                    { label: 'Seat number', value: data.seatNumber, emphasize: true },
                    { label: 'Status', value: <StatusBadge status={data.status} /> },
                  ]}
                  total={{ label: 'Total fare', value: formatFare(data.totalPrice) }}
                  footer="Payment processing does not exist in this application."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={showCancel}
        title="Cancel this booking?"
        onClose={() => !action.busy && setShowCancel(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowCancel(false)}
              disabled={action.busy}
            >
              Keep booking
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleCancel}
              disabled={action.busy}
            >
              {action.busy ? 'Cancelling…' : 'Cancel booking'}
            </button>
          </>
        }
      >
        <p className="mb-0">
          Seat <strong>{data.seatNumber}</strong> on <strong>{data.busName}</strong>{' '}
          ({data.busNumber}) will be released.
        </p>
      </Modal>
    </div>
  )
}
