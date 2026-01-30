'use client'

import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { toast } from 'react-toastify'

export default function UsersManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getUsers()
            setUsers(response.data)
        } catch (err) {
            toast.error('Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    const toggleAdmin = async (userId) => {
        try {
            await adminAPI.toggleAdmin(userId)
            fetchUsers()
            toast.success('User updated')
        } catch (err) {
            toast.error('Failed to update user')
        }
    }

    const toggleActive = async (userId) => {
        try {
            await adminAPI.toggleActive(userId)
            fetchUsers()
            toast.success('User updated')
        } catch (err) {
            toast.error('Failed to update user')
        }
    }

    if (loading) return <div className="p-4">Loading...</div>

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Users Management</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MFA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {user.profile_picture ? (
                                            <img className="h-8 w-8 rounded-full" src={user.profile_picture} alt="" />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {user.full_name?.charAt(0) || '?'}
                                                </span>
                                            </div>
                                        )}
                                        <span className="ml-3 font-medium">{user.full_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => toggleAdmin(user.id)}
                                        className={`px-2 py-1 rounded text-xs font-medium ${user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {user.is_admin ? 'Admin' : 'User'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => toggleActive(user.id)}
                                        className={`px-2 py-1 rounded text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs ${user.mfa_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {user.mfa_enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
