// Shared auth context (kept out of the component file so AuthContext.jsx
// only exports a component, as required by react-refresh rules).
import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
