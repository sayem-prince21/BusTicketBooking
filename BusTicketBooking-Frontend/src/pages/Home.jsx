import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  CalendarCheck,
  Headphones,
  Route,
  Search,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import SearchForm from '../components/SearchForm.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { liveRoutes } from '../services/busService.js'
import { formatFare } from '../utils/format.js'

// Clearly labelled preview routes, used ONLY when the API returns no buses.
// They are never presented as live backend data.
const SAMPLE_ROUTES = [
  { source: 'Dhaka', destination: 'Chattogram' },
  { source: 'Dhaka', destination: 'Sylhet' },
  { source: 'Dhaka', destination: 'Khulna' },
  { source: 'Dhaka', destination: 'Rajshahi' },
  { source: 'Chattogram', destination: 'Sylhet' },
  { source: 'Sylhet', destination: 'Khulna' },
]

const WHY_CHOOSE_US = [
  {
    icon: Search,
    title: 'Live search',
    text: 'Buses, fares and seat counts come straight from the booking API — nothing is made up.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified availability',
    text: 'Seat availability is revalidated with the server right before your booking is submitted.',
  },
  {
    icon: CalendarCheck,
    title: 'Clear pricing',
    text: 'The fare you see on the seat map is the exact amount the booking is confirmed for.',
  },
  {
    icon: Headphones,
    title: 'Manage anytime',
    text: 'Sign in to review bookings, view tickets and cancel eligible trips in one place.',
  },
]

const BENEFITS = [
  { icon: Route, title: 'Intercity routes', text: 'Search any city pair the operator publishes.' },
  { icon: Wallet, title: 'No hidden fees', text: 'The total equals the API fare — no surprise charges.' },
  { icon: BadgeCheck, title: 'Instant confirmation', text: 'Booking and ticket IDs returned by the API.' },
]

function routeHref(route, date) {
  const params = new URLSearchParams({ from: route.source, to: route.destination })
  if (date) params.set('date', date)
  return `/search?${params.toString()}`
}

export default function Home() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState({ status: 'loading', data: [], live: false })

  useEffect(() => {
    let cancelled = false
    liveRoutes().then((result) => {
      if (cancelled) return
      if (result && result.length > 0) {
        setRoutes({ status: 'done', data: result.slice(0, 6), live: true })
      } else {
        setRoutes({ status: 'done', data: SAMPLE_ROUTES, live: false })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSearch = ({ from, to, date }) => {
    const params = new URLSearchParams({ from, to, date })
    navigate(`/search?${params.toString()}`)
  }

  const defaultDate = new Date()
  defaultDate.setDate(defaultDate.getDate() + 1)

  return (
    <>
      {/* Hero + search */}
      <section className="home-hero">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-6">
              <span className="badge text-bg-light mb-3 px-3 py-2">
                Intercity bus tickets, made simple
              </span>
              <h1 className="display-5 fw-bold text-white mb-3">
                Find your bus.
                <br />
                Pick your seat. Go.
              </h1>
              <p className="lead text-white-50 mb-0">
                Search thousands of routes, check live seat availability and
                confirm your ticket in seconds.
              </p>
            </div>

            <div className="col-12 col-lg-6">
              <div className="card search-card shadow-lg border-0">
                <div className="card-body p-4">
                  <h2 className="h5 mb-3">Search buses</h2>
                  <SearchForm onSearch={handleSearch} />
                  <p className="small text-muted mt-3 mb-0">
                    City suggestions are loaded from the live API. You can also
                    type any city name.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular routes */}
      <section className="section py-5">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
            <div>
              <h2 className="section-title mb-1">Popular routes</h2>
              <p className="text-muted mb-0">
                {routes.live
                  ? 'Routes currently published by the bus operator API.'
                  : 'Quick picks to start a search.'}
              </p>
            </div>
            {!routes.live && routes.status === 'done' && (
              <span className="badge text-bg-warning">Sample data — not from the API</span>
            )}
          </div>

          {routes.status === 'loading' ? (
            <LoadingState label="Loading routes…" />
          ) : (
            <div className="row g-3">
              {routes.data.map((route) => (
                <div className="col-6 col-md-4 col-xl-2" key={`${route.source}-${route.destination}`}>
                  <Link
                    to={routeHref(route)}
                    className="card route-card h-100 text-decoration-none"
                  >
                    <div className="card-body p-3">
                      <div className="small text-muted text-uppercase">From</div>
                      <div className="fw-semibold text-dark">{route.source}</div>
                      <div className="my-1 text-center text-muted">↓</div>
                      <div className="small text-muted text-uppercase">To</div>
                      <div className="fw-semibold text-dark">{route.destination}</div>
                      {route.fare != null && (
                        <div className="small text-primary mt-2 mb-0">
                          From {formatFare(route.fare)}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why choose us */}
      <section className="section bg-light border-y">
        <div className="container py-5">
          <h2 className="section-title text-center mb-1">Why choose us</h2>
          <p className="text-center text-muted mb-4">
            A booking flow built on real API data, not guesswork.
          </p>

          <div className="row g-4">
            {WHY_CHOOSE_US.map(({ icon: Icon, title, text }) => (
              <div className="col-12 col-md-6 col-lg-3" key={title}>
                <div className="card feature-card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <span className="feature-icon">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h3 className="h6 mt-3 mb-2">{title}</h3>
                    <p className="small text-muted mb-0">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking benefits */}
      <section className="section py-5">
        <div className="container">
          <div className="row g-4 align-items-stretch">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div className="col-12 col-md-4" key={title}>
                <div className="d-flex gap-3 align-items-start h-100">
                  <span className="benefit-icon">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="h6 mb-1">{title}</h3>
                    <p className="small text-muted mb-0">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <Link to="/search" className="btn btb-btn-brand btb-btn-lg">
              <Search size={17} className="me-2" aria-hidden="true" />
              Search Buses
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
