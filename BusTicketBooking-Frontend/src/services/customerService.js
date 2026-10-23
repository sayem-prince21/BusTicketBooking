// Customer profile endpoints (Bearer + Customer role) —
// mirrors the real CustomerProfileController contract:
//   GET  /api/customer/profile
//   PUT  /api/customer/profile               { fullName, email, phoneNumber }
//   PUT  /api/customer/profile/change-password { currentPassword, newPassword }
import api from './api.js'

export function getProfile() {
  return api.get('/customer/profile').then((res) => res.data)
}

export function updateProfile(payload) {
  return api.put('/customer/profile', payload).then((res) => res.data)
}

export function changePassword(payload) {
  return api
    .put('/customer/profile/change-password', {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    })
    .then((res) => res.data)
}
