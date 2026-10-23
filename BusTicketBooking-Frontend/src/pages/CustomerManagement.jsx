import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Search, Trash2, Users } from 'lucide-react'

import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'
import TablePagination from '../components/TablePagination.jsx'
import { getErrorMessage, isConflict } from '../services/api.js'
import {
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from '../services/adminService.js'

const PAGE_SIZE = 10

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Page 6 (part 4): customer overview (admin only).
// GET/PUT/DELETE /api/admin/customers — deletion returns 409 when the customer
// has bookings, which is surfaced as-is from the API.
export default function CustomerManagement() {
  const [customers, setCustomers] = useState({ status: 'loading', data: [], error: null })
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '' })
  const [formErrors, setFormErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  const fetchCustomers = useCallback(() => {
    listCustomers()
      .then((data) => setCustomers({ status: 'done', data, error: null }))
      .catch((error) =>
        setCustomers({ status: 'error', data: [], error: getErrorMessage(error) }),
      )
  }, [])

  const load = useCallback(() => {
    setCustomers((current) => ({ ...current, status: 'loading', error: null }))
    fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return customers.data
    return customers.data.filter((customer) =>
      [customer.fullName, customer.email, customer.phoneNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    )
  }, [customers.data, query])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openEdit = (customer) => {
    setEditing(customer)
    setForm({
      fullName: customer.fullName || '',
      email: customer.email || '',
      phoneNumber: customer.phoneNumber || '',
    })
    setFormErrors({})
    setFormError(null)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (saving) return
    setFormError(null)

    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email.'
    setFormErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await updateCustomer(editing.id, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      })
      setEditing(null)
      setActionError(null)
      load()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting || deleteBusy) return
    setDeleteBusy(true)
    setActionError(null)

    try {
      await deleteCustomer(deleting.id)
      setDeleting(null)
      load()
    } catch (error) {
      // 409 Conflict: the backend refuses to delete customers with bookings.
      setActionError(
        isConflict(error)
          ? getErrorMessage(error)
          : `Could not delete customer: ${getErrorMessage(error)}`,
      )
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="mb-4">
        <h1 className="h4 mb-1">Customers</h1>
        <p className="text-muted small mb-0">
          Accounts in the Customer role, from <code>GET /api/admin/customers</code>.
        </p>
      </div>

      {actionError && (
        <div className="mb-3">
          <ErrorMessage title="Operation failed" message={actionError} />
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="mb-3" style={{ maxWidth: '380px' }}>
            <label className="visually-hidden" htmlFor="customer-search">
              Search customers
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search size={15} aria-hidden="true" />
              </span>
              <input
                id="customer-search"
                className="form-control"
                placeholder="Search name, email or phone"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          {customers.status === 'loading' ? (
            <LoadingState label="Loading customers…" />
          ) : customers.status === 'error' ? (
            <ErrorMessage message={customers.error} onRetry={load} />
          ) : paged.length === 0 ? (
            <div className="text-center py-4">
              <Users size={30} className="text-muted mb-2" aria-hidden="true" />
              <p className="text-muted mb-0">No customers found.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col" className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((customer) => (
                      <tr key={customer.id}>
                        <td className="fw-semibold">{customer.fullName}</td>
                        <td>{customer.email}</td>
                        <td>{customer.phoneNumber || '—'}</td>
                        <td className="text-end text-nowrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openEdit(customer)}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            <span className="visually-hidden">
                              Edit {customer.fullName}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleting(customer)}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            <span className="visually-hidden">
                              Delete {customer.fullName}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <TablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPage={setPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Edit */}
      <Modal
        show={Boolean(editing)}
        title="Edit customer"
        onClose={() => !saving && setEditing(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="customer-form"
              className="btn btb-btn-brand"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSave} noValidate>
          {formError && (
            <div className="alert alert-danger" role="alert">
              {formError}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label" htmlFor="customer-name">
              Full name <span className="text-danger">*</span>
            </label>
            <input
              id="customer-name"
              className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`}
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
            />
            {formErrors.fullName && (
              <div className="invalid-feedback">{formErrors.fullName}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="customer-email">
              Email <span className="text-danger">*</span>
            </label>
            <input
              id="customer-email"
              type="email"
              className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            {formErrors.email && (
              <div className="invalid-feedback">{formErrors.email}</div>
            )}
          </div>

          <div className="mb-0">
            <label className="form-label" htmlFor="customer-phone">
              Phone number
            </label>
            <input
              id="customer-phone"
              type="tel"
              className="form-control"
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <Modal
        show={Boolean(deleting)}
        title="Delete this customer?"
        onClose={() => !deleteBusy && setDeleting(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setDeleting(null)}
              disabled={deleteBusy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleteBusy}
            >
              {deleteBusy ? 'Deleting…' : 'Delete customer'}
            </button>
          </>
        }
      >
        {deleting && (
          <>
            <p className="mb-2">
              Delete <strong>{deleting.fullName}</strong> ({deleting.email})?
            </p>
            <p className="small text-muted mb-0">
              The API refuses with <code>409 Conflict</code> when this customer
              has booking records; that message is shown unchanged.
            </p>
          </>
        )}
      </Modal>
    </div>
  )
}
