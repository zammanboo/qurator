'use client'

import React, { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'

function AuthCallbackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { login } = useAuth()

    useEffect(() => {
        const token = searchParams.get('token')
        const mfaRequired = searchParams.get('mfa_required') === 'true'

        if (token) {
            login(token)
            if (mfaRequired) {
                // Redirect to MFA verification page if needed
                router.push('/profile') // Or wherever MFA is handled
            } else {
                router.push('/')
            }
        } else {
            router.push('/login')
        }
    }, [searchParams, login, router])

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Completing sign in...</p>
            </div>
        </div>
    )
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    )
}
