import { useState } from 'react'
import { LogIn, UserPlus } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage.jsx'
import { useAuth } from '../context/auth-context.js'
import { getErrorMessage } from '../services/api.js'

// Page 5 (part 1): customer login. POST /api/auth/login accepts exactly one
// identifier — email OR phone number — plus the password.
export default function Login() {
  const { login, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [identifierType, setIdentifierType] = useState('email')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from

  if (isAuthenticated) {
    return <Navigate to={from || (isAdmin ? '/admin' : '/account')} replace />
  }

  const validate = () => {
    const next = {}
    if (!identifier.trim()) {
      next.identifier =
        identifierType === 'email' ? 'Email address is required.' : 'Phone number is required.'
    }
    if (!password) next.password = 'Password is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const user = await login({ identifierType, identifier, password })
      const target =
        from || (user.roles?.includes('Admin') ? '/admin' : '/account')
      navigate(target, { replace: true })
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="section py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <div className="card auth-card border-0 shadow-sm">
              <div className="card-body p-4 p-lg-5">
                <h1 className="h4 mb-1">Welcome back</h1>
                <p className="text-muted small mb-4">
                  Sign in to view your bookings, tickets and profile.
                </p>

                {submitError && (
                  <div className="mb-3">
                    <ErrorMessage title="Sign-in failed" message={submitError} />
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <fieldset className="mb-3">
                    <legend className="form-label small mb-2">Sign in with</legend>
                    <div className="btn-group w-100" role="group" aria-label="Login identifier type">
                      <input
                        type="radio"
                        className="btn-check"
                        name="identifierType"
                        id="login-email"
                        checked={identifierType === 'email'}
                        onChange={() => {
                          setIdentifierType('email')
                          setErrors({})
                        }}
                      />
                      <label className="btn btn-outline-primary" htmlFor="login-email">
                        Email
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="identifierType"
                        id="login-phone"
                        checked={identifierType === 'phone'}
                        onChange={() => {
                          setIdentifierType('phone')
                          setErrors({})
                        }}
                      />
                      <label className="btn btn-outline-primary" htmlFor="login-phone">
                        Phone number
                      </label>
                    </div>
                  </fieldset>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="login-identifier">
                      {identifierType === 'email' ? 'Email address' : 'Phone number'}{' '}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      id="login-identifier"
                      type={identifierType === 'email' ? 'email' : 'tel'}
                      className={`form-control ${errors.identifier ? 'is-invalid' : ''}`}
                      value={identifier}
                      autoComplete={
                        identifierType === 'email' ? 'username' : 'tel'
                      }
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                    {errors.identifier && (
                      <div className="invalid-feedback">{errors.identifier}</div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="form-label" htmlFor="login-password">
                      Password <span className="text-danger">*</span>
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      value={password}
                      autoComplete="current-password"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    {errors.password && (
                      <div className="invalid-feedback">{errors.password}</div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btb-btn-brand w-100"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        <LogIn size={16} className="me-2" aria-hidden="true" />
                        Login
                      </>
                    )}
                  </button>
                </form>

                <p className="small text-center text-muted mt-4 mb-0">
                  New here?{' '}
                  <Link to="/register" className="d-inline-flex align-items-center gap-1">
                    <UserPlus size={14} aria-hidden="true" />
                    Create an account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
