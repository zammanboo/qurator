'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ProtectedRoute from '../../components/ProtectedRoute'
import {
    UsersIcon,
    FolderIcon,
    PlayCircleIcon,
    ClockIcon,
    RectangleStackIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline'

export default function AdminLayout({ children }) {
    const pathname = usePathname()

    const navItems = [
        { path: '/admin', label: 'Users', icon: UsersIcon },
        { path: '/admin/groups', label: 'Groups', icon: RectangleStackIcon },
        { path: '/admin/categories', label: 'Categories', icon: FolderIcon },
        { path: '/admin/content', label: 'Content', icon: PlayCircleIcon },
        { path: '/admin/history', label: 'User History', icon: ClockIcon },
        { path: '/admin/settings', label: 'Settings', icon: Cog6ToothIcon },
    ]

    return (
        <ProtectedRoute adminOnly>
            <div className="flex gap-6">
                {/* Sidebar */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow p-4 sticky top-24">
                        <h2 className="text-lg font-semibold mb-4">Admin Dashboard</h2>
                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${pathname === item.path
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </ProtectedRoute>
    )
}
