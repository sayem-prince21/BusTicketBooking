// Auth endpoints — mirrors the real AuthController contract:
//   POST /api/auth/register { fullName, email, phoneNumber, password }
//   POST /api/auth/login     { email } OR { phoneNumber }, plus password
//   GET  /api/auth/me        (Bearer)
import api from './api.js'

export function register(payload) {
  return api
    .post('/auth/register', {
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      password: payload.password,
    })
    .then((res) => res.data)
}

export function login(payload) {
  return api
    .post('/auth/login', {
      ...(payload.email ? { email: payload.email.trim() } : {}),
      ...(payload.phoneNumber ? { phoneNumber: payload.phoneNumber.trim() } : {}),
      password: payload.password,
    })
    .then((res) => res.data)
}

export function getMe() {
  return api.get('/auth/me').then((res) => res.data)
}
