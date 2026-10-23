import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorMessage({ message, onRetry, title = 'Something went wrong' }) {
  if (!message) return null

  return (
    <div className="alert alert-danger d-flex align-items-start gap-2 mb-0" role="alert">
      <AlertTriangle size={18} className="mt-1 flex-shrink-0" aria-hidden="true" />
      <div className="flex-grow-1">
        <strong className="d-block">{title}</strong>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          <RefreshCw size={14} className="me-1" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  )
}
