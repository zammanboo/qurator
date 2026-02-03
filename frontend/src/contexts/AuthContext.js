'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { useRouter } from 'next/navigation'

const AuthContext = createContext(null)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    // Initialize token safely for SSR
    const [token, setToken] = useState(null)
    const router = useRouter()

    useEffect(() => {
        // Check localStorage only on client side
        if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem('token')
            setToken(storedToken)
        }
    }, [])

    useEffect(() => {
        // Only fetch user if we have a token or we've determined there is no token
        if (token) {
            fetchUser()
        } else if (token === null && typeof window !== 'undefined' && !localStorage.getItem('token')) {
            // If state token is null AND localStorage is empty, stop loading
            setLoading(false)
        }
    }, [token])

    const fetchUser = async () => {
        try {
            const response = await authAPI.getMe()
            setUser(response.data)
        } catch (error) {
            console.error('Failed to fetch user:', error)
            logout()
        } finally {
            setLoading(false)
        }
    }

    const login = (newToken) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', newToken)
            setToken(newToken)
        }
    }

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
            router.push('/')
        }
    }

    const refreshUser = () => {
        fetchUser()
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}
