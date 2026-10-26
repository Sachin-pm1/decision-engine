'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, AuthResponse } from './api'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  image: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<AuthResponse>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken')
    
    if (storedUser && token && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const authResponse = await api.login(email, password)
    setUser(authResponse.user)
  }

  const register = async (email: string, password: string, name?: string) => {
    const authResponse = await api.register(email, password, name)
    return authResponse
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
