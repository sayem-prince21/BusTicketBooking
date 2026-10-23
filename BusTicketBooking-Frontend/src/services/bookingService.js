// Booking endpoints — mirrors the real BookingController contract:
//   POST   /api/booking          guest body, or Bearer to attach the account
//            body: { passengerName, passengerPhone, passengerEmail, busId, seatNumber }
//            200 → { message, booking: {...}, ticket: {...} }
//            409 → seat already booked (plain-text body)
//   GET    /api/booking          (Bearer) own bookings; admins see all
//   GET    /api/booking/{id}     (Bearer)
//   DELETE /api/booking/{id}     (Bearer) cancel
//   GET    /api/booking/confirmed | /api/booking/cancelled  (Bearer)
//
// Guest bookings cannot be listed afterwards: every read endpoint requires a
// JWT, so history/cancellation is available for account bookings only.
import api from './api.js'

export function createBooking(payload) {
  return api.post('/booking', payload).then((res) => res.data)
}

export function getMyBookings() {
  return api.get('/booking').then((res) => res.data)
}

export function getBooking(id) {
  return api.get(`/booking/${id}`).then((res) => res.data)
}

export function cancelBooking(id) {
  return api.delete(`/booking/${id}`).then((res) => res.data)
}

export function getConfirmedBookings() {
  return api.get('/booking/confirmed').then((res) => res.data)
}

export function getCancelledBookings() {
  return api.get('/booking/cancelled').then((res) => res.data)
}
