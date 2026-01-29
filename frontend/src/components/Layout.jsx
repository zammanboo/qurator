import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu } from '@headlessui/react'
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { groupsAPI } from '../services/api'

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [groups, setGroups] = useState([])
  const [expandedGroups, setExpandedGroups] = useState({})

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

  const isAdminPage = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600">
                Qurator
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user?.is_admin && (
                <Link
                  to="/admin"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Admin
                </Link>
              )}

              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600">
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.full_name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-8 w-8" />
                  )}
                  <span className="text-sm font-medium">{user?.full_name || user?.email}</span>
                </Menu.Button>

                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
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
                {groups.map((group) => (
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
