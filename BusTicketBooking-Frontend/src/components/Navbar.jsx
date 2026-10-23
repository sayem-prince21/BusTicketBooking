import { useState } from 'react'
import { Bus, LayoutDashboard, LogOut, Menu, Ticket, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/auth-context.js'

function NavItem({ to, children, onClick, className = '' }) {
  return (
    <li className="nav-item">
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          `nav-link ${isActive ? 'active' : ''} ${className}`
        }
        onClick={onClick}
      >
        {children}
      </NavLink>
    </li>
  )
}

export default function Navbar() {
  const [expanded, setExpanded] = useState(false)
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()

  const closeMenu = () => setExpanded(false)

  const handleLogout = () => {
    logout()
    closeMenu()
    navigate('/')
  }

  return (
    <nav className="btb-navbar navbar navbar-expand-lg sticky-top">
      <div className="container">
        <Link className="navbar-brand btb-brand" to="/" onClick={closeMenu}>
          <span className="btb-brand-icon">
            <Bus size={20} aria-hidden="true" />
          </span>
          <span>
            BusTicket<span className="btb-brand-accent">Booking</span>
          </span>
        </Link>

        <button
          className="navbar-toggler btb-toggler"
          type="button"
          aria-controls="mainNav"
          aria-expanded={expanded}
          aria-label="Toggle navigation"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div
          className={`collapse navbar-collapse ${expanded ? 'show' : ''}`}
          id="mainNav"
        >
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            <NavItem to="/" onClick={closeMenu}>
              Home
            </NavItem>
            <NavItem to="/search" onClick={closeMenu}>
              Search Buses
            </NavItem>

            {isAuthenticated && (
              <NavItem to="/bookings" onClick={closeMenu}>
                <Ticket size={16} className="me-1" aria-hidden="true" />
                My Bookings
              </NavItem>
            )}

            {isAuthenticated && (
              <NavItem to="/account" onClick={closeMenu}>
                My Account
              </NavItem>
            )}

            {isAdmin && (
              <NavItem to="/admin" onClick={closeMenu}>
                <LayoutDashboard size={16} className="me-1" aria-hidden="true" />
                Admin
              </NavItem>
            )}

            {isAuthenticated ? (
              <li className="nav-item d-flex align-items-center gap-2 ms-lg-2">
                <span className="btb-nav-user d-none d-lg-inline" title={user?.email}>
                  {user?.fullName || user?.email || 'Account'}
                </span>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
                  <LogOut size={15} className="me-1" aria-hidden="true" />
                  Logout
                </button>
              </li>
            ) : (
              <li className="nav-item d-flex align-items-center gap-2 ms-lg-2">
                <NavItem to="/login" onClick={closeMenu} className="btb-nav-login">
                  Login
                </NavItem>
                <Link
                  to="/register"
                  className="btn btn-sm btb-btn-brand"
                  onClick={closeMenu}
                >
                  Register
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
