import { useCallback, useEffect, useMemo, useState } from 'react'
import { Receipt, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import TablePagination from '../components/TablePagination.jsx'
import { getErrorMessage } from '../services/api.js'
import { cancelBooking, getMyBookings } from '../services/bookingService.js'
import { formatDateTime, formatFare } from '../utils/format.js'

const PAGE_SIZE = 10
const FILTERS = ['All', 'Confirmed', 'Cancelled']

// Page 6 (part 3): booking management (admin). GET /api/booking returns every
// booking for an Admin token; cancellation uses DELETE /api/booking/{id}.
export default function BookingManagement() {
  const [bookings, setBookings] = useState({ status: 'loading', data: [], error: null })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [cancelling, setCancelling] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  const fetchBookings = useCallback(() => {
    getMyBookings()
      .then((data) => setBookings({ status: 'done', data, error: null }))
      .catch((error) => setBookings({ status: 'error', data: [], error: getErrorMessage(error) }))
  }, [])

  const load = useCallback(() => {
    setBookings((current) => ({ ...current, status: 'loading', error: null }))
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return bookings.data.filter((booking) => {
      if (filter !== 'All' && booking.status !== filter) return false
      if (!needle) return true
      return [
        booking.passengerName,
        booking.busName,
        booking.busNumber,
        booking.source,
        booking.destination,
        booking.seatNumber,
        booking.bookingId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [bookings.data, query, filter])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCancel = async () => {
    if (!cancelling || busy) return
    setBusy(true)
    setActionError(null)

    try {
      await cancelBooking(cancelling.bookingId)
      setCancelling(null)
      load()
    } catch (error) {
      setActionError(getErrorMessage(error))
      setCancelling(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="mb-4">
        <h1 className="h4 mb-1">Booking management</h1>
        <p className="text-muted small mb-0">
          All bookings visible to the Admin role via <code>GET /api/booking</code>.
        </p>
      </div>

      {actionError && (
        <div className="mb-3">
          <ErrorMessage title="Operation failed" message={actionError} />
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-7">
              <label className="visually-hidden" htmlFor="booking-search">
                Search bookings
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Search size={15} aria-hidden="true" />
                </span>
                <input
                  id="booking-search"
                  className="form-control"
                  placeholder="Search passenger, bus, route, seat or reference"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
            <div className="col-12 col-md-5">
              <div className="btn-group w-100" role="group" aria-label="Filter by status">
                {FILTERS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`btn btn-sm ${filter === value ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => {
                      setFilter(value)
                      setPage(1)
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {bookings.status === 'loading' ? (
            <LoadingState label="Loading bookings…" />
          ) : bookings.status === 'error' ? (
            <ErrorMessage message={bookings.error} onRetry={load} />
          ) : paged.length === 0 ? (
            <div className="text-center py-4">
              <Receipt size={30} className="text-muted mb-2" aria-hidden="true" />
              <p className="text-muted mb-0">No bookings match the current filters.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Reference</th>
                      <th scope="col">Passenger</th>
                      <th scope="col">Bus / route</th>
                      <th scope="col">Departure</th>
                      <th scope="col">Seat</th>
                      <th scope="col">Fare</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((booking) => (
                      <tr key={booking.bookingId}>
                        <td>
                          <code className="small">
                            {String(booking.bookingId).slice(0, 8)}…
                          </code>
                        </td>
                        <td>{booking.passengerName}</td>
                        <td>
                          <div>{booking.busName}</div>
                          <div className="small text-muted">
                            {booking.source} → {booking.destination}
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

              <TablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPage={setPage}
              />
            </>
          )}
        </div>
      </div>

      <Modal
        show={Boolean(cancelling)}
        title="Cancel this booking?"
        onClose={() => !busy && setCancelling(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setCancelling(null)}
              disabled={busy}
            >
              Keep booking
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleCancel}
              disabled={busy}
            >
              {busy ? 'Cancelling…' : 'Cancel booking'}
            </button>
          </>
        }
      >
        {cancelling && (
          <p className="mb-0">
            Cancel seat <strong>{cancelling.seatNumber}</strong> for{' '}
            <strong>{cancelling.passengerName}</strong> on{' '}
            <strong>{cancelling.busName}</strong>? The seat returns to
            availability.
          </p>
        )}
      </Modal>
    </div>
  )
}
