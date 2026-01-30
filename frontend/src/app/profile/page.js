'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'

export default function Profile() {
    const { user, logout } = useAuth()

    if (!user) {
        return null
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

            <div className="bg-white rounded-lg shadow-md p-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-6">
                    {user.profile_picture ? (
                        <img
                            src={user.profile_picture}
                            alt={user.full_name}
                            className="w-20 h-20 rounded-full"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-2xl font-bold text-indigo-600">
                                {user.full_name?.charAt(0) || user.email?.charAt(0)}
                            </span>
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
                        <p className="text-gray-500">{user.email}</p>
                        {user.is_admin && (
                            <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                Admin
                            </span>
                        )}
                    </div>
                </div>

                {/* MFA Status */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            {user.mfa_enabled ? (
                                <ShieldCheckIcon className="w-8 h-8 text-green-600" />
                            ) : (
                                <ShieldExclamationIcon className="w-8 h-8 text-yellow-600" />
                            )}
                            <div>
                                <p className="font-medium text-gray-900">
                                    Two-Factor Authentication (MFA)
                                </p>
                                <p className="text-sm text-gray-500">
                                    {user.mfa_enabled
                                        ? 'Your account is protected with MFA'
                                        : 'Add an extra layer of security to your account'}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/mfa-setup"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${user.mfa_enabled
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            {user.mfa_enabled ? 'Manage MFA' : 'Enable MFA'}
                        </Link>
                    </div>
                </div>

                {/* Account Info */}
                <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>

                    <dl className="space-y-3">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Email</dt>
                            <dd className="text-gray-900">{user.email}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Account Status</dt>
                            <dd>
                                <span className={`px-2 py-1 rounded-full text-xs ${user.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </dd>
                        </div>
                        {user.created_at && (
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Member Since</dt>
                                <dd className="text-gray-900">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Actions */}
                <div className="border-t pt-6 mt-6">
                    <button
                        onClick={logout}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    )
}
