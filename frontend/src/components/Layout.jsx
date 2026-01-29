import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu } from '@headlessui/react'
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChevronDownIcon, ChevronRightIcon, ClockIcon, LockClosedIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { groupsAPI } from '../services/api'

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [groups, setGroups] = useState([])
  const [expandedGroups, setExpandedGroups] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [])

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
  }

  // 비로그인 시 첫 번째 그룹만 표시
  const visibleGroups = user ? groups : groups.slice(0, 1)

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const isAdminPage = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600 w-56">
                Qurator
              </Link>
              
              {/* Search Bar - 사이드바 너비에 맞춰 정렬 */}
              {!isAdminPage && (
                <form onSubmit={handleSearch} className="hidden sm:flex items-center ml-4">
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
                      to="/admin"
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
                            to="/history"
                            className={`${
                              active ? 'bg-gray-100' : ''
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
                            to="/profile"
                            className={`${
                              active ? 'bg-gray-100' : ''
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
                            className={`${
                              active ? 'bg-gray-100' : ''
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
          <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto">
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
                            to={`/category/${cat.slug}`}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
                              location.pathname === `/category/${cat.slug}`
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

                {/* 비로그인 시 잠긴 그룹 표시 */}
                {!user && groups.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                      <LockClosedIcon className="w-4 h-4" />
                      <span>+{groups.length - 1}개 그룹</span>
                    </div>
                    <Link
                      to="/login"
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

        {/* Main content */}
        <main className={`flex-1 px-4 sm:px-6 lg:px-8 py-8 ${!isAdminPage && groups.length > 0 ? 'ml-64' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
