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
    // Storage unavailable — the confirmation page will show the API-limited state.
  }
}

// Page 3: guest booking (no login required). Submits the real request to
// POST /api/booking with the exact DTO fields the backend expects.
export default function GuestBooking() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const busId = params.get('busId') || ''
  const seatNumber = params.get('seat') || ''
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const date = params.get('date') || ''

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
    if (!busId || !seatNumber) return undefined

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
  }, [busId, seatNumber])

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
    // Guard against duplicate submissions (button state + ref).
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setSubmitError(null)

    try {
      // Revalidate seat availability immediately before submitting.
      const seat = await getSeat(busId, seatNumber)
      if (!seat?.isAvailable) {
        setShowConfirm(false)
        setSubmitError(
          `Seat ${seatNumber} has already been booked by someone else. Please go back and choose another seat.`,
        )
        return
      }

      const data = await createBooking({
        passengerName: form.fullName.trim(),
        passengerPhone: form.phone.trim(),
        passengerEmail: form.email.trim(),
        busId,
        seatNumber,
      })

      const booking = data.booking
      const ticket = data.ticket

      rememberTicketId(booking?.bookingId, ticket?.ticketId)

      // Persist the real API response for the confirmation page.
      sessionStorage.setItem(
        'btb.lastBooking',
        JSON.stringify({
          status: 'success',
          message: data.message,
          booking,
          ticket,
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
        // 409 = seat already booked (plain-text body from the backend).
        setSubmitError(
          `${getErrorMessage(error)} Go back to the seat map to pick a different seat.`,
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
    const query = new URLSearchParams({ from, to, date }).toString()
    navigate(`/seats/${busId}?${query}`)
  }

  // Missing query parameters are handled during render (no effect needed).
  const missingParams = !busId || !seatNumber

  if (missingParams || loadState === 'error') {
    return (
      <div className="section py-5">
        <div className="container">
          <ErrorMessage
            title="Booking unavailable"
            message={
              missingParams
                ? 'Missing bus or seat information. Please start again from the seat map.'
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

  const fare = bus.ticketPrice

  return (
    <div className="section py-4 py-lg-5">
      <div className="container">
        <div className="mb-4">
          <h1 className="h4 mb-1">Guest booking</h1>
          <p className="text-muted small mb-0">
            {isAuthenticated
              ? 'You are signed in, so this booking will be linked to your account.'
              : 'No account needed — your booking details are sent straight to the API.'}
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
                <h2 className="h5 mb-4">Passenger details</h2>

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
                      These details are sent to <code>POST /api/booking</code> only.
                      No payment is processed by this application.
                    </span>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-4">
                    <button type="submit" className="btn btb-btn-brand" disabled={submitting}>
                      {submitting ? 'Processing…' : 'Confirm Booking'}
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
                { label: 'Seat number', value: seatNumber, emphasize: true },
                { label: 'Passenger', value: form.fullName || '—' },
                { label: 'Phone', value: form.phone || '—' },
                { label: 'Email', value: form.email || '—' },
                { label: 'Fare', value: formatFare(fare) },
                { label: 'Booking fee', value: formatFare(0) },
              ]}
              total={{ label: 'Total amount', value: formatFare(fare) }}
              footer="The total matches the bus fare returned by the API; this application adds no fees."
            />
          </div>
        </div>
      </div>

      <Modal
        show={showConfirm}
        title="Confirm your booking"
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
                  Booking…
                </>
              ) : (
                'Yes, confirm booking'
              )}
            </button>
          </>
        }
      >
        <div className="alert alert-warning d-flex gap-2" role="alert">
          <AlertTriangle size={18} className="mt-1 flex-shrink-0" aria-hidden="true" />
          <span>
            Seat <strong>{seatNumber}</strong> on <strong>{bus.busName}</strong> (
            {bus.busNumber}) for <strong>{formatFare(fare)}</strong>.
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
          <li>
            <strong>Total:</strong> {formatFare(fare)}
          </li>
        </ul>

        <p className="small text-muted mt-3 mb-0">
          The seat is re-checked with the API at submission time. You will see
          the real booking and ticket IDs returned by the server.
        </p>
      </Modal>
    </div>
  )
}
