import { RefreshCw } from 'lucide-react'

// Groups seat numbers like A1, A2 … J4 by their row letter, in seat order.
function groupRows(seats) {
  const sorted = [...seats].sort((a, b) =>
    String(a.seatNumber).localeCompare(String(b.seatNumber), undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  )

  const rows = new Map()
  sorted.forEach((seat) => {
    const match = String(seat.seatNumber).match(/^([A-Za-z]+)/)
    const key = match ? match[1].toUpperCase() : '#'
    if (!rows.has(key)) rows.set(key, [])
    rows.get(key).push(seat)
  })

  return [...rows.entries()]
}

// Interactive seat map driven entirely by GET /api/seat/bus/{busId}:
// booked seats are disabled so unavailable seats can never be selected.
export default function SeatMap({
  seats,
  selectedSeats = [],
  selectedSeat,
  onSelect,
  onRefresh,
  refreshing,
  maxSeats = 8,
}) {
  const rows = groupRows(seats)
  const activeSeats = Array.isArray(selectedSeats) && selectedSeats.length > 0
    ? selectedSeats
    : selectedSeat
      ? [selectedSeat]
      : []
  return (
    <div className="seat-map">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h3 className="h6 mb-0 text-muted text-uppercase">Seat map</h3>
          <span className="small text-muted">
            Click to select or deselect (Maximum {maxSeats} seats)
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {activeSeats.length > 0 && (
            <span className="badge text-bg-primary">
              {activeSeats.length} of {maxSeats} selected
            </span>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={`me-1 ${refreshing ? 'spin' : ''}`} aria-hidden="true" />
            {refreshing ? 'Refreshing…' : 'Refresh availability'}
          </button>
        </div>
      </div>

      <div className="seat-map-canvas">
        <div className="seat-map-driver text-center small text-muted mb-2">Front</div>

        {rows.map(([rowLabel, rowSeats]) => {
          const left = rowSeats.slice(0, 2)
          const right = rowSeats.slice(2)

          const renderSeat = (seat) => {
            const isBooked = seat.isAvailable === false
            const isSelected = activeSeats.includes(seat.seatNumber)

            const classes = [
              'seat',
              isBooked ? 'seat-booked' : isSelected ? 'seat-selected' : 'seat-available',
            ].join(' ')

            return (
              <button
                key={seat.seatId || seat.seatNumber}
                type="button"
                className={classes}
                disabled={isBooked}
                aria-pressed={isSelected}
                title={
                  isBooked
                    ? `${seat.seatNumber} — unavailable`
                    : `${seat.seatNumber} — available${isSelected ? ' (selected)' : ''}`
                }
                onClick={() => !isBooked && onSelect(seat.seatNumber)}
              >
                {seat.seatNumber}
              </button>
            )
          }

          return (
            <div className="seat-row" key={rowLabel}>
              <div className="seat-row-label">{rowLabel}</div>
              <div className="seat-row-group">{left.map(renderSeat)}</div>
              <div className="seat-aisle" aria-hidden="true" />
              <div className="seat-row-group">{right.map(renderSeat)}</div>
            </div>
          )
        })}
      </div>

      <ul className="seat-legend list-unstyled d-flex flex-wrap gap-3 mt-3 mb-0 small">
        <li>
          <span className="seat seat-available seat-demo" aria-hidden="true" /> Available
        </li>
        <li>
          <span className="seat seat-selected seat-demo" aria-hidden="true" /> Selected
        </li>
        <li>
          <span className="seat seat-booked seat-demo" aria-hidden="true" /> Unavailable
        </li>
      </ul>
    </div>
  )
}
