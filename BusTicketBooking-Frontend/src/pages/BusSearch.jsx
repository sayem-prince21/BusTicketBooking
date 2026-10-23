import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, MapPin, Pencil } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import BusCard from '../components/BusCard.jsx'
import SearchForm from '../components/SearchForm.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { searchBuses } from '../services/busService.js'
import { getErrorMessage } from '../services/api.js'
import { formatJourneyDate, todayIso } from '../utils/format.js'

// Page 2 (part 1): search results. Reads ?from=&to=&date= and calls
// GET /api/bus/search. Without parameters it shows the search form instead.
export default function BusSearch() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const date = params.get('date') || ''

  const [results, setResults] = useState({ key: '', status: 'idle', data: [], error: null })
  const [editingOverride, setEditingOverride] = useState(null)

  const hasQuery = Boolean(from && to && date)
  const queryKey = `${from}|${to}|${date}`
  const editing = editingOverride === null ? !hasQuery : editingOverride

  const fetchResults = useCallback(() => {
    searchBuses({ source: from, destination: to, date })
      .then((data) => setResults({ key: queryKey, status: 'done', data, error: null }))
      .catch((error) =>
        setResults({ key: queryKey, status: 'error', data: [], error: getErrorMessage(error) }),
      )
  }, [from, to, date, queryKey])

  // Retry action (event handler): show loading immediately, then refetch.
  const load = useCallback(() => {
    setResults({ key: queryKey, status: 'loading', data: [], error: null })
    fetchResults()
  }, [queryKey, fetchResults])

  useEffect(() => {
    if (!hasQuery) return undefined
    fetchResults()
    return undefined
  }, [fetchResults, hasQuery])

  // Results are derived per query key so stale data from a previous search is
  // never shown while a new one is loading.
  const view =
    results.key === queryKey || !hasQuery
      ? results
      : { key: queryKey, status: 'loading', data: [], error: null }

  const searchQuery = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`

  return (
    <div className="section py-4 py-lg-5">
      <div className="container">
        {/* Search summary */}
        <div className="card search-summary-card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <h1 className="h4 mb-2 d-flex flex-wrap align-items-center gap-2">
                  <span className="d-inline-flex align-items-center gap-1">
                    <MapPin size={17} className="text-primary" aria-hidden="true" />
                    {from || '—'}
                  </span>
                  <span className="text-muted">→</span>
                  <span className="d-inline-flex align-items-center gap-1">
                    <MapPin size={17} className="text-primary" aria-hidden="true" />
                    {to || '—'}
                  </span>
                </h1>
                <p className="text-muted mb-0 d-flex align-items-center gap-1 small">
                  <CalendarDays size={14} aria-hidden="true" />
                  {date ? formatJourneyDate(date) : 'No journey date selected'}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => setEditingOverride(!editing)}
              >
                <Pencil size={14} className="me-1" aria-hidden="true" />
                {editing ? 'Hide search form' : 'Edit search'}
              </button>
            </div>

            {editing && (
              <div className="border-top mt-3 pt-3">
                <SearchForm
                  key={queryKey}
                  initialValues={{ from, to, date: date || todayIso() }}
                  onSearch={({ from: f, to: t, date: d }) => {
                    const next = new URLSearchParams({ from: f, to: t, date: d })
                    setEditingOverride(false)
                    navigate(`/search?${next.toString()}`)
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {!hasQuery ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <h2 className="h5">Start your search</h2>
              <p className="text-muted mb-0">
                Choose an origin, destination and journey date to see available
                buses.
              </p>
            </div>
          </div>
        ) : view.status === 'loading' ? (
          <LoadingState label="Searching available buses…" />
        ) : view.status === 'error' ? (
          <ErrorMessage title="Search failed" message={view.error} onRetry={load} />
        ) : view.data.length === 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <h2 className="h5">No buses found</h2>
              <p className="text-muted mb-3">
                No buses match <strong>{from}</strong> → <strong>{to}</strong> on{' '}
                <strong>{formatJourneyDate(date)}</strong>.
              </p>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setEditingOverride(true)}
              >
                Modify search
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-muted small mb-3">
              {view.data.length} bus{view.data.length === 1 ? '' : 'es'} found
              (live data from <code>GET /api/bus/search</code>).
            </p>
            <div className="row g-3">
              {view.data.map((bus) => (
                <div className="col-12 col-lg-6" key={bus.busId}>
                  <BusCard bus={bus} journeyDate={date} searchQuery={searchQuery} />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-4">
          <Link to="/" className="btn btn-link px-0">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
