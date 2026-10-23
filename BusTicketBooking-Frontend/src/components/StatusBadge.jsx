const STYLES = {
  Confirmed: 'text-bg-success',
  Cancelled: 'text-bg-danger',
}

export default function StatusBadge({ status }) {
  const value = status || 'Unknown'
  const style = STYLES[value] || 'text-bg-secondary'

  return (
    <span className={`badge ${style}`} aria-label={`Status: ${value}`}>
      {value}
    </span>
  )
}
