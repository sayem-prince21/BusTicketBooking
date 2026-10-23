import { useState } from 'react'
import {
  Bus,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Users,
  X,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/auth-context.js'

const NAV_ITEMS = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/buses', label: 'Bus Management', icon: Bus },
  { to: '/admin/bookings', label: 'Booking Management', icon: Receipt },
  { to: '/admin/customers', label: 'Customers', icon: Users },
]

// Admin shell: collapsible sidebar + content outlet. Access is guarded by the
// Admin role in App.jsx and re-verified by the backend on every admin request.
export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="admin-shell container-fluid py-4">
      <div className="row g-4">
        <div className="col-12 col-lg-3 col-xl-2">
          <button
            type="button"
            className="btn btn-outline-secondary w-100 d-lg-none mb-3"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={16} className="me-1" /> : <Menu size={16} className="me-1" />}
            {open ? 'Hide admin menu' : 'Admin menu'}
          </button>

          <aside className={`admin-sidebar ${open ? 'admin-sidebar-open' : ''}`}>
            <div className="px-3 py-3 border-bottom border-light border-opacity-10">
              <div className="text-uppercase small text-white-50">Admin area</div>
              <div className="fw-semibold text-white">{user?.fullName || 'Administrator'}</div>
            </div>

            <nav className="nav flex-column p-2">
              {NAV_ITEMS.map(({ to, end, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `admin-nav-link d-flex align-items-center gap-2 rounded px-3 py-2 text-decoration-none ${
                      isActive ? 'active' : ''
                    }`
                  }
                >
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </NavLink>
              ))}

              <button
                type="button"
                className="admin-nav-link d-flex align-items-center gap-2 rounded px-3 py-2 mt-1 border-0 w-100 text-start"
                onClick={handleLogout}
              >
                <LogOut size={17} aria-hidden="true" />
                Logout
              </button>
            </nav>
          </aside>
        </div>

        <div className="col-12 col-lg-9 col-xl-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
