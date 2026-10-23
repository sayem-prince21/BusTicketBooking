import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import BookingSummary from '../components/BookingSummary.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'
import { useAuth } from '../context/auth-context.js'
import { getErrorMessage, isConflict } from '../services/api.js'
import { createBooking } from '../services/bookingService.js'
import { listBuses } from '../services/busService.js'
import { getSeat } from '../services/seatService.js'
import { formatFare, formatJourneyDate, formatTime } from '../utils/format.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9+\-() ]{7,20}$/

const TICKET_IDS_KEY = 'btb.ticketIds'

function rememberTicketId(bookingId, ticketId) {
  if (!bookingId || !ticketId) return
  try {
    const raw = sessionStorage.getItem(TICKET_IDS_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[bookingId] = ticketId
    sessionStorage.setItem(TICKET_IDS_KEY, JSON.stringify(map))
  } catch {
    // Storage unavailable
  }
}

// Page 3: guest booking (no login required).
// Supports multi-seat reservation (up to 8 seats).
export default function GuestBooking() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const busId = params.get('busId') || ''
  const rawSeatsParam = params.get('seats') || params.get('seat') || ''
  
  // Parse clean list of seats
  const seatList = rawSeatsParam
    .split(',')
    .map((s) => (s.includes('?') ? s.split('?')[0].trim() : s.trim()))
    .filter(Boolean)

  const seatNumberStr = seatList.join(', ')

  let from = params.get('from') || ''
  let to = params.get('to') || ''
  let date = params.get('date') || ''

  if (rawSeatsParam.includes('?')) {
    try {
      const fallbackParams = new URLSearchParams(rawSeatsParam.substring(rawSeatsParam.indexOf('?') + 1))
      if (!from) from = fallbackParams.get('from') || ''
      if (!to) to = fallbackParams.get('to') || ''
      if (!date) date = fallbackParams.get('date') || ''
    } catch {
      // ignore
    }
  }

  const [bus, setBus] = useState(null)
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState(null)

  const [form, setForm] = useState({ fullName: '', phone: '', email: '' })
  const [errors, setErrors] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (!busId || seatList.length === 0) return undefined

    let cancelled = false

    listBuses()
      .then((buses) => {
        if (cancelled) return
        const found = buses.find((b) => b.busId === busId)
        if (!found) {
          setLoadState('error')
          setLoadError('This bus could not be found. It may have been removed by the operator.')
          return
        }
        setBus(found)
        setLoadState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setLoadState('error')
        setLoadError(getErrorMessage(err))
      })

    return () => {
      cancelled = true
    }
  }, [busId, seatList.length])

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const validate = () => {
    const next = {}

    if (!form.fullName.trim()) {
      next.fullName = 'Passenger full name is required.'
    } else if (form.fullName.trim().length > 100) {
      next.fullName = 'Name must be 100 characters or fewer.'
    }

    if (!form.phone.trim()) {
      next.phone = 'Phone number is required.'
    } else if (!PHONE_PATTERN.test(form.phone.trim())) {
      next.phone = 'Enter a valid phone number (7–20 digits).'
    }

    if (!form.email.trim()) {
      next.email = 'Email address is required.'
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      next.email = 'Enter a valid email address.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (submitting) return
    setSubmitError(null)
    if (!validate()) return
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setSubmitError(null)

    try {
      // Revalidate all selected seats immediately before submitting.
      const checks = await Promise.all(seatList.map((s) => getSeat(busId, s)))
      const unavailable = checks.filter((seat) => !seat?.isAvailable).map((s) => s?.seatNumber || 'Seat')

      if (unavailable.length > 0) {
        setShowConfirm(false)
        setSubmitError(
          `Seat(s) ${unavailable.join(', ')} were already booked by someone else. Please go back and choose available seats.`,
        )
        return
      }

      const data = await createBooking({
        passengerName: form.fullName.trim(),
        passengerPhone: form.phone.trim(),
        passengerEmail: form.email.trim(),
        busId,
        seatNumber: seatNumberStr,
        seats: seatList,
      })

      const booking = data.booking
      const ticket = data.ticket

      rememberTicketId(booking?.bookingId, ticket?.ticketId)

      // Persist booking details for confirmation page
      sessionStorage.setItem(
        'btb.lastBooking',
        JSON.stringify({
          status: 'success',
          message: data.message,
          booking,
          ticket,
          seats: seatList,
          journey: {
            from: from || booking?.source,
            to: to || booking?.destination,
            date,
          },
          bus: bus
            ? {
                busName: bus.busName,
                busNumber: bus.busNumber,
                ticketPrice: bus.ticketPrice,
                departureTime: bus.departureTime,
              }
            : null,
          submittedAt: new Date().toISOString(),
        }),
      )

      setShowConfirm(false)
      navigate('/confirmation')
    } catch (error) {
      setShowConfirm(false)

      if (isConflict(error)) {
        setSubmitError(
          `${getErrorMessage(error)} Go back to the seat map to pick different seats.`,
        )
      } else {
        setSubmitError(getErrorMessage(error))
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    const query = new URLSearchParams({
      from,
      to,
      date,
      seats: seatList.join(','),
    }).toString()
    navigate(`/seats/${busId}?${query}`)
  }

  const missingParams = !busId || seatList.length === 0

  if (missingParams || loadState === 'error') {
    return (
      <div className="section py-5">
        <div className="container">
          <ErrorMessage
            title="Booking unavailable"
            message={
              missingParams
                ? 'Missing bus or seat selection. Please start again from the seat map.'
                : loadError
            }
          />
          <div className="mt-3">
            <Link to="/search">← Back to search</Link>
          </div>
        </div>
      </div>
    )
  }

  if (loadState === 'loading') {
    return (
      <div className="section py-5">
        <div className="container">
          <LoadingState label="Loading booking details…" />
        </div>
      </div>
    )
  }

  const unitFare = bus.ticketPrice || 0
  const totalFare = unitFare * seatList.length

  return (
    <div className="section py-4 py-lg-5">
      <div className="container">
        <div className="mb-4">
          <h1 className="h4 mb-1">Passenger & Booking Details</h1>
          <p className="text-muted small mb-0">
            {isAuthenticated
              ? `You are signed in; this reservation (${seatList.length} seat${seatList.length > 1 ? 's' : ''}) will be linked to your account.`
              : `Booking ${seatList.length} seat${seatList.length > 1 ? 's' : ''}. No account required — your details are recorded directly with the operator.`}
          </p>
        </div>

        {submitError && (
          <div className="mb-4">
            <ErrorMessage title="Booking failed" message={submitError} />
          </div>
        )}

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h2 className="h5 mb-3">Primary passenger details</h2>
                <p className="small text-muted mb-4">
                  Tickets for all {seatList.length} seat{seatList.length > 1 ? 's' : ''} will be issued under these contact details.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="passenger-name">
                      Passenger full name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="passenger-name"
                      className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                      value={form.fullName}
                      autoComplete="name"
                      onChange={(e) => setField('fullName', e.target.value)}
                      required
                    />
                    {errors.fullName && (
                      <div className="invalid-feedback">{errors.fullName}</div>
                    )}
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="passenger-phone">
                        Phone number <span className="text-danger">*</span>
                      </label>
                      <input
                        id="passenger-phone"
                        type="tel"
                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                        value={form.phone}
                        autoComplete="tel"
                        onChange={(e) => setField('phone', e.target.value)}
                        required
                      />
                      {errors.phone && (
                        <div className="invalid-feedback">{errors.phone}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="passenger-email">
                        Email address <span className="text-danger">*</span>
                      </label>
                      <input
                        id="passenger-email"
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        value={form.email}
                        autoComplete="email"
                        onChange={(e) => setField('email', e.target.value)}
                        required
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="alert alert-light border mt-4 mb-0 d-flex gap-2">
                    <ShieldCheck size={18} className="text-primary mt-1 flex-shrink-0" aria-hidden="true" />
                    <span className="small text-muted">
                      Reserving {seatList.length} seat{seatList.length > 1 ? 's' : ''} ({seatNumberStr}).
                      Seat availability is guaranteed upon confirmation.
                    </span>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-4">
                    <button type="submit" className="btn btb-btn-brand" disabled={submitting}>
                      {submitting ? 'Processing…' : `Confirm Booking (${formatFare(totalFare)})`}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={handleBack}>
                      <ArrowLeft size={15} className="me-1" aria-hidden="true" />
                      Back to Seat Selection
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <BookingSummary
              title="Booking summary"
              rows={[
                { label: 'Bus', value: `${bus.busName} (${bus.busNumber})` },
                { label: 'Route', value: `${bus.source} → ${bus.destination}` },
                { label: 'Journey date', value: date ? formatJourneyDate(date) : '—' },
                { label: 'Departure', value: formatTime(bus.departureTime) },
                {
                  label: `Seats (${seatList.length})`,
                  value: (
                    <div className="d-flex flex-wrap gap-1 justify-content-end">
                      {seatList.map((sn) => (
                        <span key={sn} className="badge text-bg-primary">
                          {sn}
                        </span>
                      ))}
                    </div>
                  ),
                  emphasize: true,
                },
                { label: 'Passenger', value: form.fullName || '—' },
                { label: 'Phone', value: form.phone || '—' },
                { label: 'Email', value: form.email || '—' },
                { label: 'Fare per seat', value: formatFare(unitFare) },
                { label: 'Seats count', value: `${seatList.length} seat${seatList.length > 1 ? 's' : ''}` },
              ]}
              total={{ label: 'Total amount', value: formatFare(totalFare) }}
              footer="Total amount is calculated from the unit fare per seat times the number of booked seats."
            />
          </div>
        </div>
      </div>

      <Modal
        show={showConfirm}
        title="Confirm your reservation"
        onClose={() => !submitting && setShowConfirm(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowConfirm(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btb-btn-brand"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Booking {seatList.length} seats…
                </>
              ) : (
                `Confirm ${seatList.length} seat${seatList.length > 1 ? 's' : ''}`
              )}
            </button>
          </>
        }
      >
        <div className="alert alert-warning d-flex gap-2" role="alert">
          <AlertTriangle size={18} className="mt-1 flex-shrink-0" aria-hidden="true" />
          <span>
            Reserving <strong>{seatList.length}</strong> seat{seatList.length > 1 ? 's' : ''} (<strong>{seatNumberStr}</strong>) on <strong>{bus.busName}</strong> for <strong>{formatFare(totalFare)}</strong>.
          </span>
        </div>

        <ul className="list-unstyled small mb-0">
          <li className="mb-1">
            <strong>Route:</strong> {bus.source} → {bus.destination}
          </li>
          <li className="mb-1">
            <strong>Journey date:</strong> {date ? formatJourneyDate(date) : '—'}
          </li>
          <li className="mb-1">
            <strong>Passenger:</strong> {form.fullName}
          </li>
          <li className="mb-1">
            <strong>Phone:</strong> {form.phone}
          </li>
          <li className="mb-1">
            <strong>Email:</strong> {form.email}
          </li>
          <li className="mb-1">
            <strong>Seats:</strong> {seatNumberStr}
          </li>
          <li>
            <strong>Total:</strong> {formatFare(totalFare)}
          </li>
        </ul>
      </Modal>
    </div>
  )
}