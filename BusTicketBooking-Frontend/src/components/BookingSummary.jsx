// Reusable summary card: label/value rows with an optional highlighted total.
export default function BookingSummary({ title, rows = [], total, footer, children }) {
  return (
    <div className="card booking-summary">
      <div className="card-header bg-white">
        <h2 className="h6 mb-0 text-uppercase text-muted">{title}</h2>
      </div>
      <div className="card-body">
        <dl className="summary-rows mb-0">
          {rows
            .filter((row) => row)
            .map((row) => (
              <div className="summary-row" key={row.label}>
                <dt>{row.label}</dt>
                <dd className={row.emphasize ? 'fw-semibold text-end' : 'text-end'}>
                  {row.value}
                </dd>
              </div>
            ))}
        </dl>

        {total && (
          <div className="summary-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
            <span className="fw-semibold">{total.label}</span>
            <span className="h4 mb-0 text-primary">{total.value}</span>
          </div>
        )}

        {footer && <p className="small text-muted mt-3 mb-0">{footer}</p>}
        {children}
      </div>
    </div>
  )
}
