// Central API module. Every backend call in the frontend goes through this
// axios instance so the base URL, auth header and error handling live in one
// place (requirement: no hardcoded backend URLs spread across files).
//
// The backend does NOT configure CORS and must not be modified, so the Vite
// dev server proxies "/api" to the backend (see vite.config.js). In another
// deployment, set VITE_API_BASE_URL to a same-origin path or a URL the backend
// allows.
import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const TOKEN_KEY = 'btb.token'
const USER_KEY = 'btb.user'

// The JWT is kept in sessionStorage (per-tab, cleared when the tab closes)
// rather than localStorage, and it is never rendered in the UI or logs.
export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(token, user) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    // Storage unavailable (private mode): the app still works for this tab.
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  } catch {
    // Ignore storage errors.
  }
}

const api = axios.create({ baseURL: API_BASE_URL })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    // An expired/invalid token on a protected call means the session is over.
    // Never do this for the login call itself (401 = wrong credentials).
    if (status === 401 && !url.includes('/auth/login')) {
      clearSession()
    }

    return Promise.reject(error)
  },
)

// Turns any axios/backend error into a safe, readable message.
// Never includes response headers or auth material.
export function getErrorMessage(error) {
  if (!error?.response) {
    return 'Could not reach the API server. Check that the backend is running on its configured address and try again.'
  }

  const { data, status } = error.response

  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }

  if (data?.message) return data.message
  if (data?.title) return data.title

  if (data?.errors) {
    if (Array.isArray(data.errors)) return data.errors.join(' ')
    if (typeof data.errors === 'object') {
      const messages = Object.values(data.errors).flat().filter(Boolean)
      if (messages.length) return messages.join(' ')
    }
  }

  return `Request failed${status ? ` (HTTP ${status})` : ''}. Please try again.`
}

export function isConflict(error) {
  return error?.response?.status === 409
}

export function errorStatus(error) {
  return error?.response?.status
}

export default api
