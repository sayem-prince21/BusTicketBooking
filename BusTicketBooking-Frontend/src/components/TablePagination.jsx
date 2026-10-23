// Small client-side pagination control (the API has no paging parameters).
export default function TablePagination({ page, pageSize, total, onPage }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (pageCount <= 1) return null

  const current = Math.min(Math.max(1, page), pageCount)

  return (
    <nav className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3" aria-label="Table pagination">
      <span className="small text-muted">
        Page {current} of {pageCount} · {total} record{total === 1 ? '' : 's'}
      </span>
      <div className="btn-group">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={current <= 1}
          onClick={() => onPage(current - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={current >= pageCount}
          onClick={() => onPage(current + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  )
}
