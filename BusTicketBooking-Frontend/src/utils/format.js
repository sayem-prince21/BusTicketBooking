// Formatting helpers used across pages (dates, times, fares).

// The API returns plain decimal amounts without a currency field.
// Overridable per deployment via VITE_CURRENCY.
export const CURRENCY = import.meta.env.VITE_CURRENCY || 'BDT'

export function formatFare(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(amount)
  return `${CURRENCY} ${formatted}`
}

// Safe parsing for "YYYY-MM-DD" (avoids UTC off-by-one from new Date(string)).
export function parseJourneyDate(value) {
  if (!value || typeof value !== 'string') return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  const [, y, m, d] = match
  return new Date(Number(y), Number(m) - 1, Number(d))
}

export function formatJourneyDate(value) {
  const date = parseJourneyDate(value)
  if (!date) return value || '—'
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function todayIso() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
