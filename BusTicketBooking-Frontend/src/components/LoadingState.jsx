export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <div className="spinner-border text-primary" aria-hidden="true" />
      <p className="mb-0 mt-3 text-muted">{label}</p>
    </div>
  )
}
