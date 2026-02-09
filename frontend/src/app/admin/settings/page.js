'use client'

import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../../services/api'
import { toast } from 'react-toastify'

export default function SettingsPage() {
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await adminAPI.getSettings()
            setSettings(response.data || {})
        } catch (err) {
            console.error('Failed to fetch settings:', err)
            toast.error('Failed to fetch settings: ' + (err.response?.data?.detail || err.message))
            setSettings({})
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async (key, currentValue, description) => {
        setSaving(true)
        try {
            const newValue = currentValue === 'true' ? 'false' : 'true'
            await adminAPI.updateSetting(key, newValue, description)
            setSettings(prev => ({
                ...prev,
                [key]: { ...prev[key], value: newValue }
            }))
            toast.success('Setting updated')
        } catch (err) {
            toast.error('Failed to update setting')
        } finally {
            setSaving(false)
        }
    }

    const initializeSetting = async (key, value, description) => {
        setSaving(true)
        try {
            await adminAPI.updateSetting(key, value, description)
            setSettings(prev => ({
                ...prev,
                [key]: { value, description }
            }))
            toast.success('Setting initialized')
        } catch (err) {
            toast.error('Failed to initialize setting')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-4">Loading...</div>

    const guestAccessValue = settings['allow_guest_full_access']?.value || 'false'
    const isGuestAccessEnabled = guestAccessValue === 'true'

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Site Settings</h2>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-6">
                    {/* Guest Full Access Setting */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-medium text-gray-900">
                                Guest Full Access
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Enable this to allow non-logged-in users to view all content categories.
                                When disabled, guests can only see the first category group.
                            </p>
                        </div>
                        <div className="flex items-center">
                            {!settings['allow_guest_full_access'] ? (
                                <button
                                    onClick={() => initializeSetting(
                                        'allow_guest_full_access',
                                        'false',
                                        'Allow non-logged-in users to view all content'
                                    )}
                                    disabled={saving}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Initialize
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleToggle(
                                        'allow_guest_full_access',
                                        guestAccessValue,
                                        'Allow non-logged-in users to view all content'
                                    )}
                                    disabled={saving}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        isGuestAccessEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                                    } ${saving ? 'opacity-50' : ''}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            isGuestAccessEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Status</h4>
                        <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${isGuestAccessEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            <span className="text-sm text-gray-600">
                                {isGuestAccessEnabled
                                    ? 'Guests can view all content categories'
                                    : 'Guests can only view the first category group'
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
