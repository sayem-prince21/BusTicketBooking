import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bus, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'
import TablePagination from '../components/TablePagination.jsx'
import { getErrorMessage } from '../services/api.js'
import {
  createBus,
  deleteBus,
  listBuses,
  resetBusCache,
  updateBus,
} from '../services/busService.js'
import { getSeats } from '../services/seatService.js'
import { formatFare, formatJourneyDate, formatTime } from '../utils/format.js'

const PAGE_SIZE = 8

const EMPTY_FORM = {
  busName: '',
  busNumber: '',
  source: '',
  destination: '',
  departureTime: '',
  ticketPrice: '',
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Page 6 (part 2): bus management. Uses the existing public bus endpoints
// (GET/POST/PUT/DELETE /api/bus) — the backend has no dedicated admin bus API.
export default function BusManagement() {
  const [buses, setBuses] = useState({ status: 'loading', data: [], error: null })
  const [query, setQuery] = useState('')
  const [routeFilter, setRouteFilter] = useState('All')
  const [page, setPage] = useState(1)

  const [formModal, setFormModal] = useState(null) // { mode: 'create' | 'edit', bus }
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [detailBus, setDetailBus] = useState(null)
  const [detailSeats, setDetailSeats] = useState({ status: 'idle', data: [], error: null })
  const [deleting, setDeleting] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const fetchBuses = useCallback(() => {
    listBuses()
      .then((data) => setBuses({ status: 'done', data, error: null }))
      .catch((error) => setBuses({ status: 'error', data: [], error: getErrorMessage(error) }))
  }, [])

  const load = useCallback(() => {
    setBuses((current) => ({ ...current, status: 'loading', error: null }))
    fetchBuses()
  }, [fetchBuses])

  useEffect(() => {
    fetchBuses()
  }, [fetchBuses])

  const routes = useMemo(() => {
    const set = new Set()
    buses.data.forEach((bus) => set.add(`${bus.source} → ${bus.destination}`))
    return [...set].sort()
  }, [buses.data])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return buses.data.filter((bus) => {
      if (routeFilter !== 'All' && `${bus.source} → ${bus.destination}` !== routeFilter) {
        return false
      }
      if (!needle) return true
      return [bus.busName, bus.busNumber, bus.source, bus.destination]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [buses.data, query, routeFilter])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setFormError(null)
    setFormModal({ mode: 'create' })
  }

  const openEdit = (bus) => {
    setForm({
      busName: bus.busName,
      busNumber: bus.busNumber,
      source: bus.source,
      destination: bus.destination,
      departureTime: bus.departureTime ? toLocalInputValue(new Date(bus.departureTime)) : '',
      ticketPrice: String(bus.ticketPrice ?? ''),
    })
    setFormErrors({})
    setFormError(null)
    setFormModal({ mode: 'edit', bus })
  }

  const openDetails = (bus) => {
    setDetailBus(bus)
    setDetailSeats({ status: 'loading', data: [], error: null })
    getSeats(bus.busId)
      .then((data) => setDetailSeats({ status: 'done', data, error: null }))
      .catch((error) => setDetailSeats({ status: 'error', data: [], error: getErrorMessage(error) }))
  }

  const validate = () => {
    const next = {}
    if (!form.busName.trim()) next.busName = 'Bus name is required.'
    if (!form.busNumber.trim()) next.busNumber = 'Bus number is required.'
    if (formModal?.mode === 'create') {
      if (!form.source.trim()) next.source = 'Origin is required.'
      if (!form.destination.trim()) next.destination = 'Destination is required.'
      if (
        form.source.trim() &&
        form.destination.trim() &&
        form.source.trim().toLowerCase() === form.destination.trim().toLowerCase()
      ) {
        next.destination = 'Origin and destination must differ.'
      }
      if (!form.departureTime) next.departureTime = 'Departure time is required.'
      else if (new Date(form.departureTime) <= new Date()) {
        next.departureTime = 'Departure must be in the future.'
      }
      const price = Number(form.ticketPrice)
      if (!form.ticketPrice.trim() || !Number.isFinite(price) || price <= 0) {
        next.ticketPrice = 'Enter a fare greater than zero.'
      }
    }
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (saving) return
    setFormError(null)
    if (!validate()) return

    setSaving(true)
    try {
      if (formModal.mode === 'create') {
        await createBus({
          busName: form.busName.trim(),
          busNumber: form.busNumber.trim(),
          source: form.source.trim(),
          destination: form.destination.trim(),
          departureTime: new Date(form.departureTime).toISOString(),
          ticketPrice: Number(form.ticketPrice),
        })
      } else {
        await updateBus({
          ...formModal.bus,
          busName: form.busName.trim(),
          busNumber: form.busNumber.trim(),
        })
      }

      resetBusCache()
      setFormModal(null)
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
      await deleteBus(deleting.busId)
      resetBusCache()
      setDeleting(null)
      load()
    } catch (error) {
      setActionError(getErrorMessage(error))
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h4 mb-1">Bus management</h1>
          <p className="text-muted small mb-0">
            Buses are created with 40 seats automatically by the backend.
          </p>
        </div>
        <button type="button" className="btn btb-btn-brand" onClick={openCreate}>
          <Plus size={16} className="me-1" aria-hidden="true" />
          Add bus
        </button>
      </div>

      {actionError && (
        <div className="mb-3">
          <ErrorMessage title="Operation failed" message={actionError} />
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="visually-hidden" htmlFor="bus-search">
                Search buses
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Search size={15} aria-hidden="true" />
                </span>
                <input
                  id="bus-search"
                  className="form-control"
                  placeholder="Search by name, number or city"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
            <div className="col-12 col-md-6">
              <label className="visually-hidden" htmlFor="bus-route">
                Filter by route
              </label>
              <select
                id="bus-route"
                className="form-select"
                value={routeFilter}
                onChange={(e) => {
                  setRouteFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="All">All routes</option>
                {routes.map((route) => (
                  <option value={route} key={route}>
                    {route}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {buses.status === 'loading' ? (
            <LoadingState label="Loading buses…" />
          ) : buses.status === 'error' ? (
            <ErrorMessage message={buses.error} onRetry={load} />
          ) : paged.length === 0 ? (
            <div className="text-center py-4">
              <Bus size={30} className="text-muted mb-2" aria-hidden="true" />
              <p className="text-muted mb-0">No buses match the current filters.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Bus</th>
                      <th scope="col">Route</th>
                      <th scope="col">Departure</th>
                      <th scope="col">Fare</th>
                      <th scope="col">Seats</th>
                      <th scope="col" className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((bus) => (
                      <tr key={bus.busId}>
                        <td>
                          <div className="fw-semibold">{bus.busName}</div>
                          <div className="small text-muted">{bus.busNumber}</div>
                        </td>
                        <td className="text-nowrap">
                          {bus.source} → {bus.destination}
                        </td>
                        <td className="text-nowrap">
                          <div>{formatTime(bus.departureTime)}</div>
                          <div className="small text-muted">
                            {formatJourneyDate(bus.departureTime)}
                          </div>
                        </td>
                        <td className="text-nowrap">{formatFare(bus.ticketPrice)}</td>
                        <td>
                          <span className="badge text-bg-light border">
                            {Array.isArray(bus.seats)
                              ? `${bus.seats.filter((s) => s.isAvailable).length}/${bus.seats.length} open`
                              : `${bus.totalSeats ?? 40} total`}
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => openDetails(bus)}
                            title="View details"
                          >
                            <Eye size={14} aria-hidden="true" />
                            <span className="visually-hidden">View {bus.busName}</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openEdit(bus)}
                            title="Edit name and number"
                          >
                            <Pencil size={14} aria-hidden="true" />
                            <span className="visually-hidden">Edit {bus.busName}</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleting(bus)}
                            title="Delete bus"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            <span className="visually-hidden">Delete {bus.busName}</span>
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

      {/* Create / edit */}
      <Modal
        show={Boolean(formModal)}
        title={formModal?.mode === 'create' ? 'Add a bus' : 'Edit bus'}
        onClose={() => !saving && setFormModal(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setFormModal(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="bus-form"
              className="btn btb-btn-brand"
              disabled={saving}
            >
              {saving ? 'Saving…' : formModal?.mode === 'create' ? 'Create bus' : 'Save changes'}
            </button>
          </>
        }
      >
        <form id="bus-form" onSubmit={handleSave} noValidate>
          {formError && (
            <div className="alert alert-danger" role="alert">
              {formError}
            </div>
          )}

          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <label className="form-label" htmlFor="bus-name">
                Bus name <span className="text-danger">*</span>
              </label>
              <input
                id="bus-name"
                className={`form-control ${formErrors.busName ? 'is-invalid' : ''}`}
                value={form.busName}
                onChange={(e) => setForm((f) => ({ ...f, busName: e.target.value }))}
                required
              />
              {formErrors.busName && <div className="invalid-feedback">{formErrors.busName}</div>}
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label" htmlFor="bus-number">
                Bus number <span className="text-danger">*</span>
              </label>
              <input
                id="bus-number"
                className={`form-control ${formErrors.busNumber ? 'is-invalid' : ''}`}
                value={form.busNumber}
                onChange={(e) => setForm((f) => ({ ...f, busNumber: e.target.value }))}
                required
              />
              {formErrors.busNumber && (
                <div className="invalid-feedback">{formErrors.busNumber}</div>
              )}
            </div>

            {formModal?.mode === 'create' && (
              <>
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="bus-source">
                    Origin <span className="text-danger">*</span>
                  </label>
                  <input
                    id="bus-source"
                    className={`form-control ${formErrors.source ? 'is-invalid' : ''}`}
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                    required
                  />
                  {formErrors.source && (
                    <div className="invalid-feedback">{formErrors.source}</div>
                  )}
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="bus-destination">
                    Destination <span className="text-danger">*</span>
                  </label>
                  <input
                    id="bus-destination"
                    className={`form-control ${formErrors.destination ? 'is-invalid' : ''}`}
                    value={form.destination}
                    onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                    required
                  />
                  {formErrors.destination && (
                    <div className="invalid-feedback">{formErrors.destination}</div>
                  )}
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="bus-departure">
                    Departure time <span className="text-danger">*</span>
                  </label>
                  <input
                    id="bus-departure"
                    type="datetime-local"
                    className={`form-control ${formErrors.departureTime ? 'is-invalid' : ''}`}
                    value={form.departureTime}
                    onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
                    required
                  />
                  {formErrors.departureTime && (
                    <div className="invalid-feedback">{formErrors.departureTime}</div>
                  )}
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="bus-price">
                    Ticket fare <span className="text-danger">*</span>
                  </label>
                  <input
                    id="bus-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    className={`form-control ${formErrors.ticketPrice ? 'is-invalid' : ''}`}
                    value={form.ticketPrice}
                    onChange={(e) => setForm((f) => ({ ...f, ticketPrice: e.target.value }))}
                    required
                  />
                  {formErrors.ticketPrice && (
                    <div className="invalid-feedback">{formErrors.ticketPrice}</div>
                  )}
                </div>
              </>
            )}
          </div>

          {formModal?.mode === 'edit' && (
            <p className="small text-muted mt-3 mb-0">
              The API's <code>PUT /api/bus/{'{id}'}</code> updates the bus name
              and number only; route and schedule fields stay unchanged.
            </p>
          )}
        </form>
      </Modal>

      {/* Details */}
      <Modal
        show={Boolean(detailBus)}
        title="Bus details"
        onClose={() => setDetailBus(null)}
        size="lg"
        footer={
          <button type="button" className="btn btn-outline-secondary" onClick={() => setDetailBus(null)}>
            Close
          </button>
        }
      >
        {detailBus && (
          <>
            <div className="row g-3 mb-3">
              <div className="col-sm-6">
                <div className="text-muted small">Bus name</div>
                <div className="fw-semibold">{detailBus.busName}</div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small">Bus number</div>
                <div className="fw-semibold">{detailBus.busNumber}</div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small">Route</div>
                <div className="fw-semibold">
                  {detailBus.source} → {detailBus.destination}
                </div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small">Departure</div>
                <div className="fw-semibold">
                  {formatJourneyDate(detailBus.departureTime)} ·{' '}
                  {formatTime(detailBus.departureTime)}
                </div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small">Fare</div>
                <div className="fw-semibold">{formatFare(detailBus.ticketPrice)}</div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small">Total seats</div>
                <div className="fw-semibold">{detailBus.totalSeats ?? 40}</div>
              </div>
            </div>

            <div className="border-top pt-3">
              <h3 className="h6 text-uppercase text-muted">Seat availability</h3>
              {detailSeats.status === 'loading' ? (
                <LoadingState label="Loading seats…" />
              ) : detailSeats.status === 'error' ? (
                <ErrorMessage message={detailSeats.error} />
              ) : (
                <p className="mb-0">
                  <span className="badge text-bg-success me-2">
                    {detailSeats.data.filter((s) => s.isAvailable).length} available
                  </span>
                  <span className="badge text-bg-danger">
                    {detailSeats.data.filter((s) => !s.isAvailable).length} booked
                  </span>
                  <span className="small text-muted ms-2">
                    from GET /api/seat/bus/{detailBus.busId}
                  </span>
                </p>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        show={Boolean(deleting)}
        title="Delete this bus?"
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
              {deleteBusy ? 'Deleting…' : 'Delete bus'}
            </button>
          </>
        }
      >
        {deleting && (
          <p className="mb-0">
            Delete <strong>{deleting.busName}</strong> ({deleting.busNumber})? The
            backend removes the bus and its seats. This cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  )
}
