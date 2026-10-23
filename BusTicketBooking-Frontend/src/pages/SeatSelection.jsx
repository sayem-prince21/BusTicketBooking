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

// Page 2 (part 2): interactive seat selection.
// Availability comes exclusively from GET /api/seat/bus/{busId}; the map is
// revalidated with GET /api/seat/bus/{busId}/{seatNumber} before booking.
export default function SeatSelection() {
  const { busId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const date = params.get('date') || ''

  const [bus, setBus] = useState(null)
  const [seats, setSeats] = useState([])
  const [selectedSeat, setSelectedSeat] = useState('')
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
    setSelectedSeat(seatNumber)
    setNotice(null)
  }

  const handleContinue = async () => {
    if (!selectedSeat || validating) return

    setValidating(true)
    setNotice(null)

    try {
      // Revalidate the exact seat against the API before booking.
      const seat = await getSeat(busId, selectedSeat)

      if (!seat?.isAvailable) {
        setSelectedSeat('')
        setNotice({
          type: 'danger',
          message: `Seat ${selectedSeat} was just taken. The seat map has been refreshed — please choose another seat.`,
        })
        await loadSeats(true)
        return
      }

      const searchQuery = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`
      navigate(`/booking/guest?busId=${encodeURIComponent(busId)}&seat=${encodeURIComponent(selectedSeat)}${searchQuery}`)
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
  const fare = bus?.ticketPrice
  const journeyQuery = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`

  return (
    <div className="section py-4 py-lg-5">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div>
            <h1 className="h4 mb-1">Select your seat</h1>
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
                  selectedSeat={selectedSeat}
                  onSelect={handleSelect}
                  onRefresh={handleRefresh}
                  refreshing={refreshing}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="sticky-lg-side">
              <BookingSummary
                title="Selected seat"
                rows={[
                  { label: 'Bus', value: `${bus.busName} (${bus.busNumber})` },
                  { label: 'Route', value: `${bus.source} → ${bus.destination}` },
                  { label: 'Journey date', value: date ? formatJourneyDate(date) : '—' },
                  { label: 'Departure', value: formatTime(bus.departureTime) },
                  {
                    label: 'Seat',
                    value: selectedSeat ? (
                      <span className="badge text-bg-primary">{selectedSeat}</span>
                    ) : (
                      <span className="text-muted">None selected</span>
                    ),
                    emphasize: Boolean(selectedSeat),
                  },
                ]}
                total={{ label: 'Total fare', value: formatFare(fare) }}
                footer="One seat is booked per request — the booking API accepts a single seat number. Repeat the flow to book additional seats."
              >
                <div className="d-grid gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btb-btn-brand btb-btn-lg"
                    disabled={!selectedSeat || validating}
                    onClick={handleContinue}
                  >
                    <Armchair size={17} className="me-2" aria-hidden="true" />
                    {validating ? 'Checking availability…' : 'Continue to Booking'}
                  </button>
                  <Link to="/" className="btn btn-link">
                    Cancel and go back
                  </Link>
                </div>

                {!selectedSeat && (
                  <p className="small text-muted mt-2 mb-0 text-center">
                    Choose an available seat to continue.
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
