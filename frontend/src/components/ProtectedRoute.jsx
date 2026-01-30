'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false, allowGuest = false }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user && !allowGuest) {
                router.push('/login')
            } else if (adminOnly && (!user || !user.is_admin)) {
                router.push('/')
            }
        }
    }, [user, loading, allowGuest, adminOnly, router])

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!user && !allowGuest) {
        return null // Will redirect
    }

    if (adminOnly && (!user || !user.is_admin)) {
        return null // Will redirect
    }

    return children
}
