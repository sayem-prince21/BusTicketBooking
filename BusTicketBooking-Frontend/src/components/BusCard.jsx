import { Armchair, Clock, Hash, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'

import { formatFare, formatJourneyDate, formatTime } from '../utils/format.js'

// A single bus result card. Every field shown is returned by
// GET /api/bus/search; arrival time is NOT part of the API response, so it is
// explicitly called out instead of being invented.
export default function BusCard({ bus, journeyDate, searchQuery }) {
  const seats = Number(bus.availableSeats)
  const lowSeats = Number.isFinite(seats) && seats > 0 && seats <= 5

  const seatsUrl = `/seats/${bus.busId}${searchQuery}`

  return (
    <article className="card bus-card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h3 className="h5 mb-1">{bus.busName}</h3>
            <span className="text-muted small d-inline-flex align-items-center gap-1">
              <Hash size={13} aria-hidden="true" />
              {bus.busNumber}
            </span>
          </div>
          <span
            className={`badge ${lowSeats ? 'text-bg-warning' : 'text-bg-success'}`}
          >
            {Number.isFinite(seats) ? `${seats} seats available` : 'Availability unknown'}
          </span>
        </div>

        <div className="bus-card-route d-flex align-items-center gap-3 mb-3">
          <div className="text-center">
            <div className="h4 mb-0">{formatTime(bus.departureTime)}</div>
            <div className="small text-muted">{bus.source}</div>
          </div>
          <div className="flex-grow-1 bus-route-line">
            <Navigation size={14} aria-hidden="true" />
            <span className="small text-muted d-block text-center">
              {journeyDate ? formatJourneyDate(journeyDate) : 'Scheduled departure'}
            </span>
          </div>
          <div className="text-center">
            <div className="h4 mb-0 text-muted" title="Arrival time is not provided by the API">
              —:—
            </div>
            <div className="small text-muted">{bus.destination}</div>
          </div>
        </div>

        <p className="small text-muted mb-3 d-flex align-items-center gap-1">
          <Clock size={13} aria-hidden="true" />
          Arrival time is not provided by the booking API.
        </p>

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border-top pt-3">
          <div>
            <div className="small text-muted">Fare per seat</div>
            <div className="h5 mb-0 text-primary">{formatFare(bus.ticketPrice)}</div>
          </div>
          <Link to={seatsUrl} className="btn btb-btn-brand">
            <Armchair size={16} className="me-2" aria-hidden="true" />
            View Seats
          </Link>
        </div>
      </div>
    </article>
  )
}
