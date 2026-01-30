'use client'

import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../../services/api'
import { toast } from 'react-toastify'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export default function UserHistoryManagement() {
    const [stats, setStats] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState(null)
    const [userHistory, setUserHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getHistoryStats()
            setStats(response.data)
        } catch (err) {
            toast.error('Failed to fetch history stats')
        } finally {
            setLoading(false)
        }
    }

    const viewUserHistory = async (user) => {
        setSelectedUser(user)
        setHistoryLoading(true)
        try {
            const response = await adminAPI.getUserHistory(user.user_id)
            setUserHistory(response.data)
        } catch (err) {
            toast.error('Failed to fetch user history')
        } finally {
            setHistoryLoading(false)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('ko-KR')
    }

    if (loading) return <div className="p-4">Loading...</div>

    if (selectedUser) {
        return (
            <div>
                <button
                    onClick={() => setSelectedUser(null)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4"
                >
                    <ChevronLeftIcon className="w-5 h-5" /> Back to all users
                </button>

                <div className="flex items-center gap-4 mb-6">
                    {selectedUser.profile_picture ? (
                        <img className="h-12 w-12 rounded-full" src={selectedUser.profile_picture} alt="" />
                    ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-600">
                                {selectedUser.full_name?.charAt(0) || '?'}
                            </span>
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-semibold">{selectedUser.full_name}</h2>
                        <p className="text-gray-500">{selectedUser.email}</p>
                    </div>
                </div>

                {historyLoading ? (
                    <div className="p-4">Loading history...</div>
                ) : userHistory.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                        No viewing history yet
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Watched At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {userHistory.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {item.content?.thumbnail_url && (
                                                    <img
                                                        src={item.content.thumbnail_url}
                                                        alt=""
                                                        className="h-10 w-16 object-cover rounded"
                                                    />
                                                )}
                                                <span className="font-medium">{item.content?.title || 'Deleted content'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {item.content?.category_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(item.clicked_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">User History</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Views</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {stats.map((user) => (
                            <tr key={user.user_id}>
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
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                        {user.total_clicks}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(user.last_click)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => viewUserHistory(user)}
                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                    >
                                        View History
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
