import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Ticket, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { getErrorMessage } from '../services/api.js'
import { cancelBooking, getMyBookings } from '../services/bookingService.js'
import { formatDateTime, formatFare } from '../utils/format.js'

const FILTERS = ['All', 'Confirmed', 'Cancelled']

// Page 5 (part 4): booking history. GET /api/booking returns only the signed
// in customer's bookings (admins see all); cancellation goes through
// DELETE /api/booking/{id}.
export default function MyBookings() {
  const [bookings, setBookings] = useState({ status: 'loading', data: [], error: null })
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [cancelling, setCancelling] = useState(null) // booking pending confirmation
  const [action, setAction] = useState({ busy: false, error: null })

  const fetchBookings = useCallback(() => {
    getMyBookings()
      .then((data) => setBookings({ status: 'done', data, error: null }))
      .catch((error) =>
        setBookings({ status: 'error', data: [], error: getErrorMessage(error) }),
      )
  }, [])

  const load = useCallback(() => {
    setBookings((current) => ({ ...current, status: 'loading' }))
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return bookings.data.filter((booking) => {
      if (filter !== 'All' && booking.status !== filter) return false
      if (!needle) return true
      return [booking.busName, booking.busNumber, booking.source, booking.destination, booking.seatNumber, booking.passengerName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [bookings.data, filter, query])

  const handleCancel = async () => {
    if (!cancelling || action.busy) return
    setAction({ busy: true, error: null })

    try {
      await cancelBooking(cancelling.bookingId)
      setCancelling(null)
      setAction({ busy: false, error: null })
      load()
    } catch (error) {
      setAction({ busy: false, error: getErrorMessage(error) })
    }
  }

  return (
    <div className="section py-4 py-lg-5">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h4 mb-1">My bookings</h1>
            <p className="text-muted small mb-0">
              Bookings linked to your account, exactly as returned by{' '}
              <code>GET /api/booking</code>.
            </p>
          </div>
          <Link to="/search" className="btn btb-btn-brand">
            Book a new trip
          </Link>
        </div>

        <div className="alert alert-light border d-flex flex-wrap gap-2 align-items-center justify-content-between">
          <span className="small text-muted mb-0">
            Booked as a guest without an account? Those bookings cannot be
            listed — the API requires a signed-in session to read bookings.
          </span>
          <Link to="/login" className="btn btn-sm btn-outline-primary">
            Sign in
          </Link>
        </div>

        <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-3">
          <div className="btn-group" role="group" aria-label="Filter bookings by status">
            {FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                className={`btn btn-sm ${filter === value ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="input-group" style={{ maxWidth: '320px' }}>
            <span className="input-group-text bg-white">
              <Search size={15} aria-hidden="true" />
            </span>
            <input
              className="form-control"
              placeholder="Search bus, route or seat"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search bookings"
            />
          </div>
        </div>

        {action.error && (
          <div className="mb-3">
            <ErrorMessage title="Cancellation failed" message={action.error} />
          </div>
        )}

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {bookings.status === 'loading' ? (
              <LoadingState label="Loading bookings…" />
            ) : bookings.status === 'error' ? (
              <ErrorMessage message={bookings.error} onRetry={load} />
            ) : visible.length === 0 ? (
              <div className="text-center py-5">
                <Ticket size={34} className="text-muted mb-2" aria-hidden="true" />
                <h2 className="h5">No bookings found</h2>
                <p className="text-muted mb-3">
                  {bookings.data.length === 0
                    ? 'You have not booked any trips with this account yet.'
                    : 'Nothing matches the current filter.'}
                </p>
                <Link to="/search" className="btn btb-btn-brand">
                  Search buses
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Booking</th>
                      <th scope="col">Bus / route</th>
                      <th scope="col">Departure</th>
                      <th scope="col">Seat</th>
                      <th scope="col">Fare</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((booking) => (
                      <tr key={booking.bookingId}>
                        <td className="text-nowrap">
                          <div className="small text-muted">Reference</div>
                          <code className="small">
                            {String(booking.bookingId).slice(0, 8)}…
                          </code>
                        </td>
                        <td>
                          <div className="fw-semibold">{booking.busName}</div>
                          <div className="small text-muted">
                            {booking.busNumber} · {booking.source} → {booking.destination}
                          </div>
                        </td>
                        <td className="text-nowrap">{formatDateTime(booking.departureTime)}</td>
                        <td>
                          <span className="badge text-bg-light border">{booking.seatNumber}</span>
                        </td>
                        <td className="text-nowrap">{formatFare(booking.totalPrice)}</td>
                        <td>
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="text-end text-nowrap">
                          <Link
                            to={`/bookings/${booking.bookingId}`}
                            className="btn btn-sm btn-outline-primary me-1"
                          >
                            View
                          </Link>
                          {booking.status === 'Confirmed' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setCancelling(booking)}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <p className="small text-muted mt-3 mb-0">
          Ticket IDs are only returned by <code>POST /api/booking</code>; they
          are shown on the details page when they were captured during booking.
        </p>
      </div>

      <Modal
        show={Boolean(cancelling)}
        title="Cancel this booking?"
        onClose={() => !action.busy && setCancelling(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setCancelling(null)}
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
              {action.busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Cancelling…
                </>
              ) : (
                <>
                  <XCircle size={15} className="me-1" aria-hidden="true" />
                  Cancel booking
                </>
              )}
            </button>
          </>
        }
      >
        {cancelling && (
          <>
            <p className="mb-2">
              Cancel seat <strong>{cancelling.seatNumber}</strong> on{' '}
              <strong>{cancelling.busName}</strong> ({cancelling.busNumber})?
            </p>
            <p className="small text-muted mb-0">
              The seat is released back to availability through{' '}
              <code>DELETE /api/booking/{String(cancelling.bookingId).slice(0, 8)}…</code>.
              This cannot be undone from this screen.
            </p>
          </>
        )}
      </Modal>
    </div>
  )
}
