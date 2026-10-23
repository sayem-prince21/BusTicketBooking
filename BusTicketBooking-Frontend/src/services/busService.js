// Bus endpoints — mirrors the real BusController contract:
//   GET    /api/bus/search?source=&destination=&date=   (public)
//   GET    /api/bus                                     (public, includes seats)
//   POST   /api/bus                                     (admin management UI)
//   PUT    /api/bus/{id}                                (updates name + number)
//   DELETE /api/bus/{id}
// There is no GET /api/bus/{id} endpoint, so bus details are resolved from
// the list endpoint.
import api from './api.js'

export function searchBuses({ source, destination, date }) {
  return api
    .get('/bus/search', { params: { source, destination, date } })
    .then((res) => res.data)
}

export function listBuses() {
  return api.get('/bus').then((res) => res.data)
}

// Cached copy of GET /api/bus: several pages (city suggestions, popular
// routes, bus detail lookup) read the same public list.
let busesPromise = null
export function listBusesCached() {
  if (!busesPromise) {
    busesPromise = listBuses().catch((error) => {
      busesPromise = null
      throw error
    })
  }
  return busesPromise
}

export function resetBusCache() {
  busesPromise = null
}

// Distinct cities present in live bus data (for search suggestions).
export function citySuggestions() {
  return listBusesCached()
    .then((buses) => {
      const cities = new Set()
      buses.forEach((bus) => {
        if (bus.source) cities.add(bus.source)
        if (bus.destination) cities.add(bus.destination)
      })
      return [...cities].sort((a, b) => a.localeCompare(b))
    })
    .catch(() => [])
}

// Unique source → destination pairs for the popular routes section.
export function liveRoutes() {
  return listBusesCached()
    .then((buses) => {
      const seen = new Set()
      const routes = []
      buses.forEach((bus) => {
        if (!bus.source || !bus.destination) return
        const key = `${bus.source}>>${bus.destination}`
        if (seen.has(key)) return
        seen.add(key)
        routes.push({
          source: bus.source,
          destination: bus.destination,
          fare: bus.ticketPrice,
        })
      })
      return routes
    })
    .catch(() => null)
}

export function findBusById(busId) {
  return listBuses().then((buses) => buses.find((b) => b.busId === busId) || null)
}

export function createBus(payload) {
  return api.post('/bus', payload).then((res) => res.data)
}

// PUT /api/bus/{id} binds a full Bus object but only reads busName/busNumber;
// existing route/schedule values are sent back unchanged.
export function updateBus(bus) {
  return api
    .put(`/bus/${bus.busId}`, {
      busId: bus.busId,
      busName: bus.busName,
      busNumber: bus.busNumber,
      source: bus.source,
      destination: bus.destination,
      departureTime: bus.departureTime,
      ticketPrice: bus.ticketPrice,
      totalSeats: bus.totalSeats ?? 40,
    })
    .then((res) => res.data)
}

export function deleteBus(busId) {
  return api.delete(`/bus/${busId}`).then((res) => res.data)
}
