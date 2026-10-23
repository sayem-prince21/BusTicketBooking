import { useCallback, useEffect, useState } from 'react'
import {
  CalendarCheck,
  KeyRound,
  LogOut,
  Receipt,
  Ticket,
  UserCog,
  XCircle,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import BookingSummary from '../components/BookingSummary.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAuth } from '../context/auth-context.js'
import { getErrorMessage } from '../services/api.js'
import { getMyBookings } from '../services/bookingService.js'
import {
  changePassword,
  getProfile,
  updateProfile,
} from '../services/customerService.js'
import { formatDateTime, formatFare } from '../utils/format.js'

// Page 5 (part 3): customer dashboard — account overview, booking statistics,
// recent bookings, profile update and password change, all backed by the real
// endpoints (GET /api/booking, GET|PUT /api/customer/profile, PUT
// /api/customer/profile/change-password).
export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState({ status: 'loading', data: [], error: null })
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', phoneNumber: '' })
  const [profileSaved, setProfileSaved] = useState(null)
  const [profileSaving, setProfileSaving] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const fetchBookings = useCallback(() => {
    getMyBookings()
      .then((data) => setBookings({ status: 'done', data, error: null }))
      .catch((error) =>
        setBookings({ status: 'error', data: [], error: getErrorMessage(error) }),
      )
  }, [])

  const loadBookings = useCallback(() => {
    setBookings((current) => ({ ...current, status: 'loading' }))
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    fetchBookings()

    getProfile()
      .then((data) => {
        setProfile(data)
        setProfileForm({
          fullName: data.fullName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
        })
      })
      .catch((error) => setProfileError(getErrorMessage(error)))
  }, [fetchBookings])

  const stats = bookings.data.reduce(
    (acc, booking) => {
      const status = booking.status || ''
      if (status === 'Confirmed') acc.confirmed += 1
      else if (status === 'Cancelled') acc.cancelled += 1
      else acc.other += 1
      acc.total += 1
      acc.spend += Number(booking.totalPrice) || 0
      return acc
    },
    { total: 0, confirmed: 0, cancelled: 0, other: 0, spend: 0 },
  )

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    if (profileSaving) return
    setProfileSaved(null)

    const next = {}
    if (!profileForm.fullName.trim()) next.fullName = 'Full name is required.'
    if (!profileForm.email.trim()) next.email = 'Email is required.'
    if (Object.keys(next).length) {
      setProfileSaved({ type: 'danger', text: 'Please fix the highlighted fields.' })
      return
    }

    setProfileSaving(true)
    try {
      const result = await updateProfile({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
      })
      setProfile(result.profile || profile)
      setProfileSaved({ type: 'success', text: result.message || 'Profile updated.' })
    } catch (error) {
      setProfileSaved({ type: 'danger', text: getErrorMessage(error) })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    if (passwordSaving) return
    setPasswordMessage(null)

    const next = {}
    if (!passwordForm.currentPassword) next.currentPassword = 'Current password is required.'
    if (!passwordForm.newPassword) next.newPassword = 'New password is required.'
    else if (passwordForm.newPassword.length < 8) next.newPassword = 'Use at least 8 characters.'
    if (passwordForm.confirmPassword !== passwordForm.newPassword)
      next.confirmPassword = 'Passwords do not match.'

    setPasswordErrors(next)
    if (Object.keys(next).length) return

    setPasswordSaving(true)
    try {
      const result = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordMessage({ type: 'success', text: result.message || 'Password changed.' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setPasswordMessage({ type: 'danger', text: getErrorMessage(error) })
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="section py-4 py-lg-5">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h4 mb-1">My account</h1>
            <p className="text-muted mb-0">
              Welcome back{user?.fullName ? `, ${user.fullName}` : ''}.
            </p>
          </div>
          <button type="button" className="btn btn-outline-danger" onClick={handleLogout}>
            <LogOut size={16} className="me-1" aria-hidden="true" />
            Logout
          </button>
        </div>

        {/* Statistics */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="card stat-card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                  <Receipt size={15} aria-hidden="true" /> Total bookings
                </div>
                <div className="h3 mb-0">{bookings.status === 'loading' ? '…' : stats.total}</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card stat-card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                  <CalendarCheck size={15} aria-hidden="true" /> Confirmed
                </div>
                <div className="h3 mb-0 text-success">
                  {bookings.status === 'loading' ? '…' : stats.confirmed}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card stat-card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                  <XCircle size={15} aria-hidden="true" /> Cancelled
                </div>
                <div className="h3 mb-0 text-danger">
                  {bookings.status === 'loading' ? '…' : stats.cancelled}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card stat-card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                  <Ticket size={15} aria-hidden="true" /> Total fare booked
                </div>
                <div className="h3 mb-0">
                  {bookings.status === 'loading' ? '…' : formatFare(stats.spend)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h2 className="h6 mb-0">Recent bookings</h2>
            <Link to="/bookings" className="btn btn-sm btn-outline-primary">
              View all bookings
            </Link>
          </div>
          <div className="card-body">
            {bookings.status === 'loading' ? (
              <LoadingState label="Loading your bookings…" />
            ) : bookings.status === 'error' ? (
              <ErrorMessage message={bookings.error} onRetry={loadBookings} />
            ) : bookings.data.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted mb-3">You have not booked any trips yet.</p>
                <Link to="/search" className="btn btb-btn-brand">
                  Search buses
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Bus</th>
                      <th scope="col">Route</th>
                      <th scope="col">Departure</th>
                      <th scope="col">Seat</th>
                      <th scope="col">Fare</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-end">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.data.slice(0, 5).map((booking) => (
                      <tr key={booking.bookingId}>
                        <td>
                          <div className="fw-semibold">{booking.busName}</div>
                          <div className="small text-muted">{booking.busNumber}</div>
                        </td>
                        <td>
                          {booking.source} → {booking.destination}
                        </td>
                        <td className="text-nowrap">{formatDateTime(booking.departureTime)}</td>
                        <td>
                          <span className="badge text-bg-light border">{booking.seatNumber}</span>
                        </td>
                        <td className="text-nowrap">{formatFare(booking.totalPrice)}</td>
                        <td>
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="text-end">
                          <Link
                            to={`/bookings/${booking.bookingId}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="row g-4">
          {/* Profile */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white">
                <h2 className="h6 mb-0 d-flex align-items-center gap-2">
                  <UserCog size={16} aria-hidden="true" /> Profile details
                </h2>
              </div>
              <div className="card-body">
                {profileError ? (
                  <ErrorMessage
                    title="Profile unavailable"
                    message={profileError}
                  />
                ) : (
                  <form onSubmit={handleProfileSubmit} noValidate>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="profile-name">
                        Full name
                      </label>
                      <input
                        id="profile-name"
                        className="form-control"
                        value={profileForm.fullName}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, fullName: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="profile-email">
                        Email
                      </label>
                      <input
                        id="profile-email"
                        type="email"
                        className="form-control"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, email: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="profile-phone">
                        Phone number
                      </label>
                      <input
                        id="profile-phone"
                        type="tel"
                        className="form-control"
                        value={profileForm.phoneNumber}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, phoneNumber: e.target.value }))
                        }
                      />
                    </div>

                    {profileSaved && (
                      <div className={`alert alert-${profileSaved.type}`} role="alert">
                        {profileSaved.text}
                      </div>
                    )}

                    <button type="submit" className="btn btb-btn-brand" disabled={profileSaving}>
                      {profileSaving ? 'Saving…' : 'Save profile'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white">
                <h2 className="h6 mb-0 d-flex align-items-center gap-2">
                  <KeyRound size={16} aria-hidden="true" /> Change password
                </h2>
              </div>
              <div className="card-body">
                <form onSubmit={handlePasswordSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="pw-current">
                      Current password
                    </label>
                    <input
                      id="pw-current"
                      type="password"
                      autoComplete="current-password"
                      className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
                      }
                      required
                    />
                    {passwordErrors.currentPassword && (
                      <div className="invalid-feedback">{passwordErrors.currentPassword}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="pw-new">
                      New password
                    </label>
                    <input
                      id="pw-new"
                      type="password"
                      autoComplete="new-password"
                      className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
                      }
                      required
                    />
                    {passwordErrors.newPassword ? (
                      <div className="invalid-feedback">{passwordErrors.newPassword}</div>
                    ) : (
                      <div className="form-text">
                        8+ characters with upper case, lower case, digit and symbol.
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="pw-confirm">
                      Confirm new password
                    </label>
                    <input
                      id="pw-confirm"
                      type="password"
                      autoComplete="new-password"
                      className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                      }
                      required
                    />
                    {passwordErrors.confirmPassword && (
                      <div className="invalid-feedback">{passwordErrors.confirmPassword}</div>
                    )}
                  </div>

                  {passwordMessage && (
                    <div className={`alert alert-${passwordMessage.type}`} role="alert">
                      {passwordMessage.text}
                    </div>
                  )}

                  <button type="submit" className="btn btb-btn-brand" disabled={passwordSaving}>
                    {passwordSaving ? 'Updating…' : 'Change password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {profile && (
          <div className="mt-4">
            <BookingSummary
              title="Account"
              rows={[
                { label: 'Name', value: profile.fullName || '—' },
                { label: 'Email', value: profile.email || '—' },
                { label: 'Phone', value: profile.phoneNumber || '—' },
                { label: 'User ID', value: profile.id || user?.userId || '—' },
              ]}
              footer="Your session token is stored per tab only and is never displayed anywhere in this interface."
            />
          </div>
        )}
      </div>
    </div>
  )
}
