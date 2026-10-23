// Admin endpoints (Bearer + Admin role) — mirrors the real controllers:
//   GET    /api/admin/dashboard           welcome/role probe
//   GET    /api/admin/dashboard/summary   { totalCustomers, totalBookings,
//                                           confirmedBookings, cancelledBookings }
//   GET    /api/admin/customers           list customers
//   GET    /api/admin/customers/{id}
//   PUT    /api/admin/customers/{id}      { fullName, email, phoneNumber }
//   DELETE /api/admin/customers/{id}      409 when the customer has bookings
// There is no admin bus controller: bus CRUD uses the public /api/bus routes,
// and booking management uses /api/booking (admins see every booking).
import api from './api.js'

export function getDashboard() {
  return api.get('/admin/dashboard').then((res) => res.data)
}

export function getSummary() {
  return api.get('/admin/dashboard/summary').then((res) => res.data)
}

export function listCustomers() {
  return api.get('/admin/customers').then((res) => res.data)
}

export function getCustomer(id) {
  return api.get(`/admin/customers/${id}`).then((res) => res.data)
}

export function updateCustomer(id, payload) {
  return api.put(`/admin/customers/${id}`, payload).then((res) => res.data)
}

export function deleteCustomer(id) {
  return api.delete(`/admin/customers/${id}`).then((res) => res.data)
}
