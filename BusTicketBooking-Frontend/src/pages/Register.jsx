import { useState } from 'react'
import { LogIn, UserPlus } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage.jsx'
import { useAuth } from '../context/auth-context.js'
import { getErrorMessage } from '../services/api.js'
import { register } from '../services/authService.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9+\-() ]{7,20}$/

// Password rules mirror the backend Identity configuration (Program.cs):
// 8+ characters with upper, lower, digit and a non-alphanumeric character.
const PASSWORD_HINT =
  'At least 8 characters with an uppercase letter, a lowercase letter, a digit and a symbol.'

// Page 5 (part 2): registration. POST /api/auth/register with the real DTO
// fields: fullName, email, phoneNumber, password.
export default function Register() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const validate = () => {
    const next = {}

    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    else if (form.fullName.trim().length > 100) next.fullName = 'Name must be 100 characters or fewer.'

    if (!form.email.trim()) next.email = 'Email address is required.'
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address.'

    if (!form.phoneNumber.trim()) next.phoneNumber = 'Phone number is required.'
    else if (!PHONE_PATTERN.test(form.phoneNumber.trim()))
      next.phoneNumber = 'Enter a valid phone number (7–20 digits).'

    if (!form.password) next.password = 'Password is required.'
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters.'

    if (form.confirmPassword !== form.password)
      next.confirmPassword = 'Passwords do not match.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setSubmitError(null)
    setSuccessMessage(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      await register(form)

      // Registration returns no token, so sign in with the same credentials to
      // continue the session (falls back to a manual login on failure).
      try {
        await login({
          identifierType: 'email',
          identifier: form.email,
          password: form.password,
        })
        navigate('/account', { replace: true })
      } catch {
        setSuccessMessage(
          'Registration successful. You can now sign in with your email and password.',
        )
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (isAuthenticated && !successMessage) {
    return <Navigate to="/account" replace />
  }

  return (
    <div className="section py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card auth-card border-0 shadow-sm">
              <div className="card-body p-4 p-lg-5">
                <h1 className="h4 mb-1">Create your account</h1>
                <p className="text-muted small mb-4">
                  Register to keep track of your bookings and tickets.
                </p>

                {submitError && (
                  <div className="mb-3">
                    <ErrorMessage title="Registration failed" message={submitError} />
                  </div>
                )}

                {successMessage && (
                  <div className="alert alert-success" role="alert">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                      <span>{successMessage}</span>
                      <Link to="/login" className="btn btn-sm btn-success">
                        Go to login
                      </Link>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="reg-name">
                      Full name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="reg-name"
                      className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                      value={form.fullName}
                      autoComplete="name"
                      onChange={(e) => setField('fullName', e.target.value)}
                      required
                    />
                    {errors.fullName && (
                      <div className="invalid-feedback">{errors.fullName}</div>
                    )}
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label" htmlFor="reg-email">
                        Email address <span className="text-danger">*</span>
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        value={form.email}
                        autoComplete="email"
                        onChange={(e) => setField('email', e.target.value)}
                        required
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label" htmlFor="reg-phone">
                        Phone number <span className="text-danger">*</span>
                      </label>
                      <input
                        id="reg-phone"
                        type="tel"
                        className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                        value={form.phoneNumber}
                        autoComplete="tel"
                        onChange={(e) => setField('phoneNumber', e.target.value)}
                        required
                      />
                      {errors.phoneNumber && (
                        <div className="invalid-feedback">{errors.phoneNumber}</div>
                      )}
                    </div>
                  </div>

                  <div className="row g-3 mt-0">
                    <div className="col-12 col-sm-6">
                      <label className="form-label" htmlFor="reg-password">
                        Password <span className="text-danger">*</span>
                      </label>
                      <input
                        id="reg-password"
                        type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        value={form.password}
                        autoComplete="new-password"
                        onChange={(e) => setField('password', e.target.value)}
                        required
                      />
                      {errors.password ? (
                        <div className="invalid-feedback">{errors.password}</div>
                      ) : (
                        <div className="form-text">{PASSWORD_HINT}</div>
                      )}
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label" htmlFor="reg-confirm">
                        Confirm password <span className="text-danger">*</span>
                      </label>
                      <input
                        id="reg-confirm"
                        type="password"
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        value={form.confirmPassword}
                        autoComplete="new-password"
                        onChange={(e) => setField('confirmPassword', e.target.value)}
                        required
                      />
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword}</div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btb-btn-brand w-100 mt-4"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                        Creating account…
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="me-2" aria-hidden="true" />
                        Register
                      </>
                    )}
                  </button>
                </form>

                <p className="small text-center text-muted mt-4 mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="d-inline-flex align-items-center gap-1">
                    <LogIn size={14} aria-hidden="true" />
                    Login
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
