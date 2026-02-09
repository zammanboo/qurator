'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { Menu } from '@headlessui/react'
import { UserCircleIcon, ArrowRightOnRectangleIcon, ChevronDownIcon, ChevronRightIcon, ClockIcon, LockClosedIcon, MagnifyingGlassIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { groupsAPI, settingsAPI } from '../services/api'

export default function Layout({ children }) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [groups, setGroups] = useState([])
    const [expandedGroups, setExpandedGroups] = useState({})
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [allowGuestFullAccess, setAllowGuestFullAccess] = useState(false)

    // Determine if we should show the full layout (sidebar + navbar)
    const isAuthPage = pathname === '/login' || pathname === '/auth/callback'
    const isAdminPage = pathname?.startsWith('/admin')

    useEffect(() => {
        if (!isAuthPage) {
            fetchGroups()
        }
    }, [isAuthPage])

    const fetchGroups = async () => {
        try {
            const response = await groupsAPI.getAll()
            setGroups(response.data)
            // Expand all groups by default
            const expanded = {}
            response.data.forEach(g => { expanded[g.id] = true })
            setExpandedGroups(expanded)
        } catch (err) {
            console.error('Failed to fetch groups', err)
        }

        // Settings 로드 (실패해도 기본값 사용)
        try {
            const settingsResponse = await settingsAPI.getPublic()
            setAllowGuestFullAccess(settingsResponse.data?.allow_guest_full_access === 'true')
        } catch (err) {
            console.error('Failed to fetch settings', err)
        }
    }

    // If it's an auth page, just render children without layout wrapper
    if (isAuthPage) {
        return children
    }

    // 비로그인 시 첫 번째 그룹만 표시 (설정에 따라 전체 공개 가능)
    const visibleGroups = (user || allowGuestFullAccess) ? groups : groups.slice(0, 1)

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }))
    }

    const handleLogout = () => {
        logout()
        // Router push handled in logout function of AuthContext, but just in case
        // router.push('/login') 
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            {/* Mobile Menu Button */}
                            {!isAdminPage && (
                                <button
                                    type="button"
                                    className="lg:hidden -ml-2 mr-2 p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100"
                                    onClick={() => setMobileMenuOpen(true)}
                                >
                                    <span className="sr-only">Open menu</span>
                                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                                </button>
                            )}

                            <Link href="/" className="flex items-center lg:w-64 w-auto pl-2" onClick={() => setSearchQuery('')}>
                                <img
                                    src="/zubu9dan_logo.png"
                                    alt="주부9단"
                                    className="h-10 w-auto"
                                />
                            </Link>

                            {/* Search Bar - 사이드바 너비에 맞춰 정렬 */}
                            {!isAdminPage && (
                                <form onSubmit={handleSearch} className="hidden sm:flex items-center">
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="콘텐츠 검색..."
                                            className="pl-10 pr-4 py-2 w-[480px] lg:w-[576px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    {user.is_admin && (
                                        <Link
                                            href="/admin"
                                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                                        >
                                            Admin
                                        </Link>
                                    )}

                                    <Menu as="div" className="relative">
                                        <Menu.Button className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600">
                                            {user.profile_picture ? (
                                                <img
                                                    src={user.profile_picture}
                                                    alt={user.full_name}
                                                    className="h-8 w-8 rounded-full"
                                                />
                                            ) : (
                                                <UserCircleIcon className="h-8 w-8" />
                                            )}
                                            <span className="text-sm font-medium">{user.full_name || user.email}</span>
                                        </Menu.Button>

                                        <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        href="/history"
                                                        className={`${active ? 'bg-gray-100' : ''
                                                            } flex items-center px-4 py-2 text-sm text-gray-700`}
                                                    >
                                                        <ClockIcon className="h-5 w-5 mr-2" />
                                                        시청 기록
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        href="/profile"
                                                        className={`${active ? 'bg-gray-100' : ''
                                                            } flex items-center px-4 py-2 text-sm text-gray-700`}
                                                    >
                                                        <Cog6ToothIcon className="h-5 w-5 mr-2" />
                                                        Profile Settings
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={handleLogout}
                                                        className={`${active ? 'bg-gray-100' : ''
                                                            } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                                                    >
                                                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                                                        Logout
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </Menu.Items>
                                    </Menu>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex pt-16">
                {/* Sidebar - only show on non-admin pages */}
                {!isAdminPage && groups.length > 0 && (
                    <aside className="hidden lg:block w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto">
                        <div className="p-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">카테고리</h2>
                            <nav className="space-y-1">
                                {visibleGroups.map((group) => (
                                    <div key={group.id || 'ungrouped'}>
                                        <button
                                            onClick={() => toggleGroup(group.id)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>{group.icon}</span>
                                                <span>{group.name}</span>
                                            </span>
                                            {expandedGroups[group.id] ? (
                                                <ChevronDownIcon className="w-4 h-4" />
                                            ) : (
                                                <ChevronRightIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                        {expandedGroups[group.id] && (
                                            <div className="ml-4 mt-1 space-y-1">
                                                {group.categories.map((cat) => (
                                                    <Link
                                                        key={cat.id}
                                                        href={`/category/${cat.slug}`}
                                                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${pathname === `/category/${cat.slug}`
                                                            ? 'bg-indigo-50 text-indigo-600'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span>{cat.icon}</span>
                                                        <span>{cat.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* 비로그인 시 잠긴 그룹 표시 (전체 공개가 아닐 때만) */}
                                {!user && !allowGuestFullAccess && groups.length > 1 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                                            <LockClosedIcon className="w-4 h-4" />
                                            <span>+{groups.length - 1}개 그룹</span>
                                        </div>
                                        <Link
                                            href="/login"
                                            className="block px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                        >
                                            로그인하여 모두 보기 →
                                        </Link>
                                    </div>
                                )}
                            </nav>
                        </div>
                    </aside>
                )}

                {/* Mobile Sidebar (Drawer) */}
                {!isAdminPage && groups.length > 0 && mobileMenuOpen && (
                    <div className="relative z-50 lg:hidden" role="dialog" aria-modal="true">
                        {/* Backdrop */}
                        <div className="fixed inset-0 bg-gray-900/50" aria-hidden="true" onClick={() => setMobileMenuOpen(false)}></div>

                        <div className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-4 pb-6 sm:max-w-sm sm:px-6 sm:ring-1 sm:ring-gray-900/10">
                            <div className="flex items-center justify-between p-4 -mx-4 mb-4 border-b">
                                <Link href="/" className="flex items-center" onClick={() => { setMobileMenuOpen(false); setSearchQuery('') }}>
                                    <img
                                        src="/zubu9dan_logo.png"
                                        alt="주부9단"
                                        className="h-8 w-auto"
                                    />
                                </Link>
                                <button
                                    type="button"
                                    className="-m-2.5 rounded-md p-2.5 text-gray-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="sr-only">Close menu</span>
                                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>

                            {/* Mobile Nav Content - Same as Desktop */}
                            <nav className="space-y-1">
                                {visibleGroups.map((group) => (
                                    <div key={group.id || 'ungrouped'}>
                                        <button
                                            onClick={() => toggleGroup(group.id)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>{group.icon}</span>
                                                <span>{group.name}</span>
                                            </span>
                                            {expandedGroups[group.id] ? (
                                                <ChevronDownIcon className="w-4 h-4" />
                                            ) : (
                                                <ChevronRightIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                        {expandedGroups[group.id] && (
                                            <div className="ml-4 mt-1 space-y-1">
                                                {group.categories.map((cat) => (
                                                    <Link
                                                        key={cat.id}
                                                        href={`/category/${cat.slug}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${pathname === `/category/${cat.slug}`
                                                            ? 'bg-indigo-50 text-indigo-600'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span>{cat.icon}</span>
                                                        <span>{cat.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {!user && !allowGuestFullAccess && groups.length > 1 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                                            <LockClosedIcon className="w-4 h-4" />
                                            <span>+{groups.length - 1}개 그룹</span>
                                        </div>
                                        <Link
                                            href="/login"
                                            className="block px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                        >
                                            로그인하여 모두 보기 →
                                        </Link>
                                    </div>
                                )}
                            </nav>
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main className={`flex-1 px-4 sm:px-6 lg:px-8 py-8 ${!isAdminPage && groups.length > 0 ? 'lg:ml-64' : ''}`}>
                    {/* Mobile Search Bar */}
                    {!isAdminPage && (
                        <form onSubmit={handleSearch} className="block sm:hidden mb-4">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="콘텐츠 검색..."
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </form>
                    )}
                    {children}
                </main>
            </div>
        </div>
    )
}
