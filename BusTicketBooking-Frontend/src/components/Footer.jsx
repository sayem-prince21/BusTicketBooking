import { Bus, MapPin, ShieldCheck, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="btb-footer">
      <div className="container">
        <div className="row g-4 py-5">
          <div className="col-12 col-md-4">
            <div className="btb-footer-brand d-flex align-items-center gap-2 mb-3">
              <Bus size={20} aria-hidden="true" />
              <span className="fw-semibold">
                BusTicket<span className="text-info">Booking</span>
              </span>
            </div>
            <p className="small text-white-50 mb-2">
              Intercity bus search, live seat availability and instant booking
              confirmations.
            </p>
            <p className="small text-white-50 mb-0">
              Fares, schedules and availability shown on this site are loaded
              from the live booking API.
            </p>
          </div>

          <div className="col-6 col-md-4">
            <h2 className="h6 text-uppercase text-white-50 mb-3">Explore</h2>
            <ul className="list-unstyled small d-grid gap-2">
              <li>
                <Link to="/" className="footer-link">
                  <MapPin size={14} aria-hidden="true" /> Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="footer-link">
                  <Ticket size={14} aria-hidden="true" /> Search Buses
                </Link>
              </li>
              <li>
                <Link to="/bookings" className="footer-link">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/account" className="footer-link">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-6 col-md-4">
            <h2 className="h6 text-uppercase text-white-50 mb-3">Account</h2>
            <ul className="list-unstyled small d-grid gap-2">
              <li>
                <Link to="/login" className="footer-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="footer-link">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/admin" className="footer-link">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <span className="footer-link d-inline-flex align-items-center gap-1 text-white-50">
                  <ShieldCheck size={14} aria-hidden="true" /> Secured by JWT
                  authentication
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="btb-footer-bottom border-top border-light border-opacity-10 py-3 small text-white-50">
          © {new Date().getFullYear()} BusTicketBooking. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
