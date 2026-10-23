// Seat endpoints — mirrors the real SeatController contract:
//   GET /api/seat/bus/{busId}                  (all seats + availability)
//   GET /api/seat/bus/{busId}/{seatNumber}     (single seat revalidation)
//   GET /api/seat/bus/{busId}/available
//   GET /api/seat/bus/{busId}/booked
import api from './api.js'

export function getSeats(busId) {
  return api.get(`/seat/bus/${busId}`).then((res) => res.data)
}

export function getSeat(busId, seatNumber) {
  return api.get(`/seat/bus/${busId}/${encodeURIComponent(seatNumber)}`).then((res) => res.data)
}

export function getAvailableSeats(busId) {
  return api.get(`/seat/bus/${busId}/available`).then((res) => res.data)
}

export function getBookedSeats(busId) {
  return api.get(`/seat/bus/${busId}/booked`).then((res) => res.data)
}
