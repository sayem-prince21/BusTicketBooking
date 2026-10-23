import { useCallback, useEffect, useState } from 'react'
import {
  Bus,
  CalendarCheck,
  Receipt,
  Users,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { getErrorMessage } from '../services/api.js'
import { getDashboard, getSummary } from '../services/adminService.js'
import { listBuses } from '../services/busService.js'
import { getMyBookings } from '../services/bookingService.js'
import { formatDateTime, formatFare } from '../utils/format.js'

// Page 6 (part 1): admin dashboard overview.
// Stats come from GET /api/admin/dashboard/summary; the bus total from
// GET /api/bus; the booking table from GET /api/booking (admins see all).
// There is no "recent bookings" sorting field in the API response, so the
// first entries returned by the API are shown and labelled accordingly.
export default function AdminDashboard() {
  const [data, setData] = useState({
    status: 'loading',
    summary: null,
    buses: [],
    bookings: [],
    welcome: null,
    error: null,
  })

  const fetchDashboard = useCallback(() => {
    Promise.allSettled([getSummary(), listBuses(), getMyBookings(), getDashboard()]).then(
      ([summaryRes, busesRes, bookingsRes, dashboardRes]) => {
        if (summaryRes.status === 'rejected') {
          setData({
            status: 'error',
            summary: null,
            buses: [],
            bookings: [],
            welcome: null,
            error: getErrorMessage(summaryRes.reason),
          })
          return
        }

        setData({
          status: 'done',
          summary: summaryRes.value,
          buses: busesRes.status === 'fulfilled' ? busesRes.value : [],
          bookings: bookingsRes.status === 'fulfilled' ? bookingsRes.value : [],
          welcome: dashboardRes.status === 'fulfilled' ? dashboardRes.value?.message : null,
          error: null,
        })
      },
    )
  }, [])

  const load = useCallback(() => {
    setData((current) => ({ ...current, status: 'loading', error: null }))
    fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (data.status === 'loading') {
    return (
      <div className="admin-page">
        <LoadingState label="Loading dashboard…" />
      </div>
    )
  }

  if (data.status === 'error') {
    return (
      <div className="admin-page">
        <ErrorMessage
          title="Dashboard unavailable"
          message={data.error}
          onRetry={load}
        />
      </div>
    )
  }

  const summary = data.summary || {}
  const confirmed = data.bookings.filter((b) => b.status === 'Confirmed')
  const recent = data.bookings.slice(0, 5)

  const stats = [
    {
      label: 'Total buses',
      value: data.buses.length,
      icon: Bus,
      tone: 'primary',
      to: '/admin/buses',
    },
    {
      label: 'Total bookings',
      value: summary.totalBookings ?? data.bookings.length,
      icon: Receipt,
      tone: 'info',
      to: '/admin/bookings',
    },
    {
      label: 'Customers',
      value: summary.totalCustomers ?? '—',
      icon: Users,
      tone: 'secondary',
      to: '/admin/customers',
    },
    {
      label: 'Confirmed bookings',
      value: summary.confirmedBookings ?? confirmed.length,
      icon: CalendarCheck,
      tone: 'success',
      to: '/admin/bookings',
    },
    {
      label: 'Cancelled bookings',
      value: summary.cancelledBookings ?? '—',
      icon: XCircle,
      tone: 'danger',
      to: '/admin/bookings',
    },
  ]

  return (
    <div className="admin-page">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h4 mb-1">Dashboard overview</h1>
          <p className="text-muted small mb-0">
            {data.welcome || 'Administrator tools powered by the existing admin API.'}
          </p>
        </div>
        <Link to="/admin/buses" className="btn btn-sm btb-btn-brand">
          Manage buses
        </Link>
      </div>

      <div className="row g-3 mb-4">
        {stats.map(({ label, value, icon: Icon, tone, to }) => (
          <div className="col-6 col-xl" key={label}>
            <Link to={to} className="card admin-stat border-0 shadow-sm text-decoration-none h-100">
              <div className="card-body">
                <div className={`admin-stat-icon admin-stat-${tone}`}>
                  <Icon size={17} aria-hidden="true" />
                </div>
                <div className="small text-muted mt-2 mb-1">{label}</div>
                <div className="h4 mb-0 text-dark">{value}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h2 className="h6 mb-0">Latest bookings</h2>
          <Link to="/admin/bookings" className="btn btn-sm btn-outline-primary">
            Manage bookings
          </Link>
        </div>
        <div className="card-body">
          {recent.length === 0 ? (
            <p className="text-muted mb-0">No bookings yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Passenger</th>
                    <th scope="col">Bus / route</th>
                    <th scope="col">Seat</th>
                    <th scope="col">Fare</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((booking) => (
                    <tr key={booking.bookingId}>
                      <td>
                        <div className="fw-semibold">{booking.passengerName}</div>
                        <div className="small text-muted">
                          {formatDateTime(booking.departureTime)}
                        </div>
                      </td>
                      <td>
                        <div>{booking.busName}</div>
                        <div className="small text-muted">
                          {booking.source} → {booking.destination}
                        </div>
                      </td>
                      <td>
                        <span className="badge text-bg-light border">{booking.seatNumber}</span>
                      </td>
                      <td className="text-nowrap">{formatFare(booking.totalPrice)}</td>
                      <td>
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="small text-muted mt-3 mb-0">
            Booking dates are not included in <code>GET /api/booking</code>, so
            rows appear in the order the API returns them.
          </p>
        </div>
      </div>
    </div>
  )
}
