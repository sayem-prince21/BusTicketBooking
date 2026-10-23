// JWT helpers.
//
// A JWT payload is not encrypted — it is only signed — so decoding it locally
// is safe and is used ONLY to shape the UI (which nav links to show). Every
// protected action is still authorized by the backend, which validates the
// signature, expiry and roles itself.

export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export function getRoles(payload) {
  const raw = payload?.role ?? payload?.roles ?? []
  return Array.isArray(raw) ? raw : [raw]
}

export function isTokenExpired(payload) {
  if (!payload?.exp) return false
  return payload.exp * 1000 <= Date.now()
}
