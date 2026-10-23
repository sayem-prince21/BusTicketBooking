// Session-level auth state: current user, roles, login/logout.
// The token itself lives in sessionStorage via services/api.js and is only
// attached to requests — it is never rendered anywhere in the UI.
import { useCallback, useMemo, useState } from 'react'

import api, {
  clearSession,
  getStoredUser,
  getToken,
  setSession,
} from '../services/api.js'
import { decodeJwt, getRoles, isTokenExpired } from '../utils/jwt.js'
import { AuthContext } from './auth-context.js'

function readInitialSession() {
  const token = getToken()
  const user = getStoredUser()

  if (!token || !user) return null

  const payload = decodeJwt(token)
  if (!payload || isTokenExpired(payload)) {
    clearSession()
    return null
  }

  return { ...user, roles: getRoles(payload) }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readInitialSession)

  const login = useCallback(async ({ identifierType, identifier, password }) => {
    const body =
      identifierType === 'phone'
        ? { phoneNumber: identifier.trim(), password }
        : { email: identifier.trim(), password }

    const { data } = await api.post('/auth/login', body)

    const payload = decodeJwt(data.token)
    const nextUser = {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      roles: getRoles(payload),
    }

    setSession(data.token, nextUser)
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.roles?.includes('Admin')),
      login,
      logout,
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
