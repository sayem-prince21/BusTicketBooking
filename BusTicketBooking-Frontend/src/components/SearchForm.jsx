import { useEffect, useId, useState } from 'react'
import { CalendarDays, MapPin, Search } from 'lucide-react'

import { citySuggestions } from '../services/busService.js'
import { todayIso } from '../utils/format.js'

// Reusable bus search form (hero + "edit search" on the results page).
// City suggestions come from live bus data (GET /api/bus); when the API has
// no buses yet the field simply stays a free-text input.
export default function SearchForm({ onSearch, initialValues = {}, submitting = false }) {
  const listId = useId()
  const [from, setFrom] = useState(initialValues.from || '')
  const [to, setTo] = useState(initialValues.to || '')
  const [date, setDate] = useState(initialValues.date || '')
  const [cities, setCities] = useState([])
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let cancelled = false
    citySuggestions().then((result) => {
      if (!cancelled) setCities(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const validate = () => {
    const next = {}
    const origin = from.trim()
    const destination = to.trim()

    if (!origin) next.from = 'Please select where you are travelling from.'
    if (!destination) next.to = 'Please select your destination.'
    if (origin && destination && origin.toLowerCase() === destination.toLowerCase()) {
      next.to = 'Origin and destination must be different.'
    }
    if (!date) {
      next.date = 'Please choose a journey date.'
    } else if (date < todayIso()) {
      next.date = 'Journey date cannot be in the past.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (submitting) return
    if (!validate()) return
    onSearch({ from: from.trim(), to: to.trim(), date })
  }

  const swap = () => {
    setFrom(to)
    setTo(from)
    setErrors((current) => ({ ...current, from: undefined, to: undefined }))
  }

  return (
    <form className="search-form" onSubmit={handleSubmit} noValidate>
      <datalist id={listId}>
        {cities.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>

      <div className="row g-3">
        <div className="col-12 col-md-3">
          <label className="form-label" htmlFor="search-from">
            From city
          </label>
          <div className="input-group">
            <span className="input-group-text">
              <MapPin size={16} aria-hidden="true" />
            </span>
            <input
              id="search-from"
              className={`form-control ${errors.from ? 'is-invalid' : ''}`}
              list={listId}
              placeholder="Origin city"
              value={from}
              autoComplete="address-level2"
              onChange={(e) => setFrom(e.target.value)}
              required
            />
            {errors.from && <div className="invalid-feedback">{errors.from}</div>}
          </div>
        </div>

        <div className="col-12 col-md-3 align-self-md-end position-relative">
          <button
            type="button"
            className="btn btn-light btb-swap-btn"
            onClick={swap}
            aria-label="Swap origin and destination"
            title="Swap origin and destination"
          >
            ⇄
          </button>
          <label className="form-label" htmlFor="search-to">
            To city
          </label>
          <div className="input-group">
            <span className="input-group-text">
              <MapPin size={16} aria-hidden="true" />
            </span>
            <input
              id="search-to"
              className={`form-control ${errors.to ? 'is-invalid' : ''}`}
              list={listId}
              placeholder="Destination city"
              value={to}
              autoComplete="address-level2"
              onChange={(e) => setTo(e.target.value)}
              required
            />
            {errors.to && <div className="invalid-feedback">{errors.to}</div>}
          </div>
        </div>

        <div className="col-12 col-md-3">
          <label className="form-label" htmlFor="search-date">
            Journey date
          </label>
          <div className="input-group">
            <span className="input-group-text">
              <CalendarDays size={16} aria-hidden="true" />
            </span>
            <input
              id="search-date"
              type="date"
              className={`form-control ${errors.date ? 'is-invalid' : ''}`}
              value={date}
              min={todayIso()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            {errors.date && <div className="invalid-feedback">{errors.date}</div>}
          </div>
        </div>

        <div className="col-12 col-md-3 d-grid">
          <button type="submit" className="btn btb-btn-brand btb-btn-lg" disabled={submitting}>
            <Search size={17} className="me-2" aria-hidden="true" />
            {submitting ? 'Searching…' : 'Search Buses'}
          </button>
        </div>
      </div>
    </form>
  )
}
