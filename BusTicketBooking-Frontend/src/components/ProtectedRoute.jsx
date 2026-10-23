// Route guard. Unauthenticated visitors are sent to /login and returned to the
// page they asked for. Role checks here only shape the UI: the backend still
// authorizes every protected request with the JWT (401/403), so hiding a link
// is never treated as authorization.
import { Link, Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../context/auth-context.js'

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (role === 'Admin' && !isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          <h1 className="h5 alert-heading">Administrator access required</h1>
          <p className="mb-2">
            Your account does not have the Admin role, so this area is not
            available. The backend enforces this restriction as well.
          </p>
          <Link className="btn btn-sm btn-outline-warning" to="/">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return children
}
