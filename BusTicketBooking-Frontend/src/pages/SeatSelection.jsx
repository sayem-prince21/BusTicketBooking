import { useCallback, useEffect, useState } from 'react'
import { Armchair, ArrowLeft, CalendarDays, MapPin, Navigation } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import BookingSummary from '../components/BookingSummary.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import SeatMap from '../components/SeatMap.jsx'
import { getErrorMessage } from '../services/api.js'
import { listBuses } from '../services/busService.js'
import { getSeat, getSeats } from '../services/seatService.js'
import { formatFare, formatJourneyDate, formatTime } from '../utils/format.js'

const MAX_SEATS = 8

// Page 2 (part 2): interactive seat selection.
// Supports multi-seat selection (up to 8 seats).
export default function SeatSelection() {
  const { busId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const date = params.get('date') || ''

  const [bus, setBus] = useState(null)
  const [seats, setSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])

  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [validating, setValidating] = useState(false)
  const [notice, setNotice] = useState(null)

  const loadBus = useCallback(() => {
    return listBuses()
      .then((buses) => buses.find((b) => b.busId === busId) || null)
      .catch(() => null)
  }, [busId])

  const loadSeats = useCallback(
    (silent = false) => {
      if (!silent) {
        setRefreshing(true)
      }
      return getSeats(busId)
        .then((data) => {
          setSeats(data)
          setError(null)
          return data
        })
        .catch((err) => {
          if (!silent) setError(getErrorMessage(err))
          throw err
        })
        .finally(() => setRefreshing(false))
    },
    [busId],
  )

  useEffect(() => {
    let cancelled = false

    Promise.all([loadBus(), getSeats(busId).catch((err) => err)])
      .then(([busResult, seatsResult]) => {
        if (cancelled) return

        if (!busResult) {
          setStatus('error')
          setError('This bus could not be found. It may have been removed.')
          return
        }

        if (seatsResult instanceof Error || seatsResult?.isAxiosError) {
          setStatus('error')
          setError(getErrorMessage(seatsResult))
          return
        }

        setBus(busResult)
        setSeats(seatsResult)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setError(getErrorMessage(err))
      })

    return () => {
      cancelled = true
    }
  }, [busId, loadBus])

  const handleRefresh = () => {
    setNotice(null)
    loadSeats(true).catch(() => {
      // error already stored by loadSeats
    })
  }

  const handleSelect = (seatNumber) => {
    setNotice(null)
    if (selectedSeats.includes(seatNumber)) {
      // সিলেক্ট করা থাকলে বাদ যাবে
      setSelectedSeats((prev) => prev.filter((s) => s !== seatNumber))
    } else {
      if (selectedSeats.length >= MAX_SEATS) {
        setNotice({
          type: 'warning',
          message: `You can select a maximum of ${MAX_SEATS} seats per reservation.`,
        })
        return
      }
      setSelectedSeats((prev) => [...prev, seatNumber].sort())
    }
  }

  const handleRemoveSeat = (seatNumber) => {
    setSelectedSeats((prev) => prev.filter((s) => s !== seatNumber))
  }

  const handleContinue = async () => {
    if (selectedSeats.length === 0 || validating) return

    setValidating(true)
    setNotice(null)

    try {
      // সবগুলো নির্বাচিত সিট একসাথে চেক করা হচ্ছে
      const checks = await Promise.all(selectedSeats.map((s) => getSeat(busId, s)))
      const unavailable = checks.filter((seat) => !seat?.isAvailable).map((s) => s?.seatNumber || 'Selected seat')

      if (unavailable.length > 0) {
        setSelectedSeats((prev) => prev.filter((s) => !unavailable.includes(s)))
        setNotice({
          type: 'danger',
          message: `${unavailable.join(', ')} ${unavailable.length === 1 ? 'was' : 'were'} just taken. The seat map has been refreshed — please pick another seat.`,
        })
        await loadSeats(true)
        return
      }

      const nextParams = new URLSearchParams()
      nextParams.set('busId', busId)
      nextParams.set('seats', selectedSeats.join(','))
      nextParams.set('seat', selectedSeats[0])
      if (from) nextParams.set('from', from)
      if (to) nextParams.set('to', to)
      if (date) nextParams.set('date', date)
      navigate(`/booking/guest?${nextParams.toString()}`)
    } catch (err) {
      setNotice({
        type: 'danger',
        message: getErrorMessage(err),
      })
    } finally {
      setValidating(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="section py-5">
        <div className="container">
          <LoadingState label="Loading seat map…" />
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="section py-5">
        <div className="container">
          <ErrorMessage title="Could not load seats" message={error} onRetry={() => window.location.reload()} />
          <div className="mt-3">
            <Link to={from && to && date ? `/search?from=${from}&to=${to}&date=${date}` : '/search'}>
              ← Back to search results
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const availableCount = seats.filter((seat) => seat.isAvailable).length
  const unitFare = bus?.ticketPrice || 0
  const totalFare = unitFare * selectedSeats.length
  const journeyQuery = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`

  return (
    <div className="section py-4 py-lg-5">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div>
            <h1 className="h4 mb-1">Select your seats</h1>
            <p className="text-muted small mb-0 d-flex flex-wrap align-items-center gap-3">
              <span className="d-inline-flex align-items-center gap-1">
                <MapPin size={14} aria-hidden="true" />
                {bus.source} → {bus.destination}
              </span>
              <span className="d-inline-flex align-items-center gap-1">
                <CalendarDays size={14} aria-hidden="true" />
                {date ? formatJourneyDate(date) : 'Date not specified'}
              </span>
              <span className="d-inline-flex align-items-center gap-1">
                <Navigation size={14} aria-hidden="true" />
                {formatTime(bus.departureTime)}
              </span>
            </p>
          </div>
          <Link
            to={from && to && date ? `/search${journeyQuery}` : '/search'}
            className="btn btn-sm btn-outline-secondary"
          >
            <ArrowLeft size={14} className="me-1" aria-hidden="true" />
            Back to results
          </Link>
        </div>

        {notice && (
          <div className="alert alert-danger" role="alert">
            {notice.message}
          </div>
        )}

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <div>
                    <h2 className="h5 mb-1">{bus.busName}</h2>
                    <span className="small text-muted">Bus #{bus.busNumber}</span>
                  </div>
                  <span className="badge text-bg-light border">
                    {availableCount} of {seats.length} seats open
                  </span>
                </div>

                <SeatMap
                  seats={seats}
                  selectedSeats={selectedSeats}
                  onSelect={handleSelect}
                  onRefresh={handleRefresh}
                  refreshing={refreshing}
                  maxSeats={MAX_SEATS}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="sticky-lg-side">
              <BookingSummary
                title="Selected seats"
                rows={[
                  { label: 'Bus', value: `${bus.busName} (${bus.busNumber})` },
                  { label: 'Route', value: `${bus.source} → ${bus.destination}` },
                  { label: 'Journey date', value: date ? formatJourneyDate(date) : '—' },
                  { label: 'Departure', value: formatTime(bus.departureTime) },
                  {
                    label: `Selected seats (${selectedSeats.length}/${MAX_SEATS})`,
                    value: selectedSeats.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1 justify-content-end">
                        {selectedSeats.map((sn) => (
                          <span key={sn} className="badge text-bg-primary d-inline-flex align-items-center gap-1">
                            {sn}
                            <button
                              type="button"
                              className="btn-close btn-close-white p-0"
                              style={{ width: '0.55rem', height: '0.55rem' }}
                              aria-label={`Remove seat ${sn}`}
                              onClick={() => handleRemoveSeat(sn)}
                            />
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">None selected</span>
                    ),
                    emphasize: selectedSeats.length > 0,
                  },
                  {
                    label: 'Fare per seat',
                    value: formatFare(unitFare),
                  },
                ]}
                total={{
                  label: `Total fare (${selectedSeats.length} seat${selectedSeats.length === 1 ? '' : 's'})`,
                  value: formatFare(totalFare),
                }}
                footer={`You can select and book up to ${MAX_SEATS} seats in a single reservation.`}
              >
                <div className="d-grid gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btb-btn-brand btb-btn-lg"
                    disabled={selectedSeats.length === 0 || validating}
                    onClick={handleContinue}
                  >
                    <Armchair size={17} className="me-2" aria-hidden="true" />
                    {validating
                      ? 'Checking availability…'
                      : selectedSeats.length > 0
                        ? `Continue to Booking (${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''})`
                        : 'Select seats to continue'}
                  </button>
                  <Link to="/" className="btn btn-link">
                    Cancel and go back
                  </Link>
                </div>

                {selectedSeats.length === 0 && (
                  <p className="small text-muted mt-2 mb-0 text-center">
                    Choose up to {MAX_SEATS} available seats on the seat map.
                  </p>
                )}
              </BookingSummary>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}