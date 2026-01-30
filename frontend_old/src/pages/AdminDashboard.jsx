import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { adminAPI } from '../services/api'
import { toast } from 'react-toastify'
import { 
  UsersIcon, 
  FolderIcon, 
  PlayCircleIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  Bars3Icon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Users Management Component
function UsersManagement() {
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
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {user.is_admin ? 'Admin' : 'User'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleActive(user.id)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.mfa_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
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

// Sortable Category Row Component
function SortableCategoryRow({ cat, onEdit, onDelete, onToggleActive, onGroupChange, groups }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? 'bg-indigo-50' : ''}>
      <td className="px-6 py-4 whitespace-nowrap">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
          <Bars3Icon className="w-5 h-5 text-gray-400" />
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-2xl">{cat.icon}</td>
      <td className="px-6 py-4 whitespace-nowrap font-medium">{cat.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat.slug}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={cat.group_id || ''}
          onChange={(e) => onGroupChange(cat.id, e.target.value ? parseInt(e.target.value) : null)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="">No Group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
          ))}
        </select>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onToggleActive(cat.id)}
          className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${
            cat.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat.is_active ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button onClick={() => onEdit(cat)} className="text-indigo-600 hover:text-indigo-900 mr-3">
          <PencilIcon className="w-5 h-5" />
        </button>
        <button onClick={() => onDelete(cat.id)} className="text-red-600 hover:text-red-900">
          <TrashIcon className="w-5 h-5" />
        </button>
      </td>
    </tr>
  )
}

// Categories Management Component
function CategoriesManagement() {
  const [categories, setCategories] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', icon: '', order: 0, group_id: null })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [catsRes, groupsRes] = await Promise.all([
        adminAPI.getCategories(),
        adminAPI.getGroups()
      ])
      setCategories(catsRes.data)
      setGroups(groupsRes.data)
    } catch (err) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getCategories()
      setCategories(response.data)
    } catch (err) {
      toast.error('Failed to fetch categories')
    }
  }

  const handleGroupChange = async (categoryId, groupId) => {
    try {
      await adminAPI.updateCategory(categoryId, { group_id: groupId || null })
      toast.success('Group updated')
      fetchCategories()
    } catch (err) {
      toast.error('Failed to update group')
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id)
      const newIndex = categories.findIndex((c) => c.id === over.id)
      const newCategories = arrayMove(categories, oldIndex, newIndex)
      setCategories(newCategories)
      
      // Update order in backend
      const orders = newCategories.map((cat, index) => ({ id: cat.id, order: index }))
      try {
        await adminAPI.reorderCategories(orders)
        toast.success('Order updated')
      } catch (err) {
        toast.error('Failed to update order')
        fetchCategories() // Revert on error
      }
    }
  }

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        icon: category.icon || '',
        order: category.order || 0
      })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', slug: '', description: '', icon: '', order: 0 })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory.id, formData)
        toast.success('Category updated')
      } else {
        await adminAPI.createCategory(formData)
        toast.success('Category created')
      }
      setShowModal(false)
      fetchCategories()
    } catch (err) {
      toast.error('Failed to save category')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await adminAPI.deleteCategory(id)
      toast.success('Category deleted')
      fetchCategories()
    } catch (err) {
      toast.error('Failed to delete category')
    }
  }

  const handleToggleActive = async (id) => {
    try {
      await adminAPI.toggleCategoryActive(id)
      toast.success('Category status updated')
      fetchCategories()
    } catch (err) {
      toast.error('Failed to update category status')
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Categories Management</h2>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-5 h-5" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Drag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <tbody className="divide-y divide-gray-200">
                {categories.map((cat) => (
                  <SortableCategoryRow key={cat.id} cat={cat} onEdit={openModal} onDelete={handleDelete} onToggleActive={handleToggleActive} onGroupChange={handleGroupChange} groups={groups} />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Icon (emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Sortable Content Row Component
function SortableContentRow({ item, onEdit, onDelete, onToggleActive, getCategoryName, onCategoryChange, categories }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? 'bg-indigo-50' : ''}>
      <td className="px-6 py-4 whitespace-nowrap">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
          <Bars3Icon className="w-5 h-5 text-gray-400" />
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <img 
          src={item.thumbnail_url || `https://img.youtube.com/vi/${item.youtube_id}/default.jpg`}
          alt="" 
          className="h-12 w-20 object-cover rounded"
        />
      </td>
      <td className="px-6 py-4">
        <div className="font-medium text-gray-900 line-clamp-1">{item.title}</div>
        <div className="text-sm text-gray-500">{item.youtube_id}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={item.category_id}
          onChange={(e) => onCategoryChange(item.id, parseInt(e.target.value))}
          className="text-sm border rounded px-2 py-1"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          ))}
        </select>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onToggleActive(item.id)}
          className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${
            item.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {item.is_active ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button onClick={() => onEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-3">
          <PencilIcon className="w-5 h-5" />
        </button>
        <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900">
          <TrashIcon className="w-5 h-5" />
        </button>
      </td>
    </tr>
  )
}

// Content Management Component
function ContentManagement() {
  const [content, setContent] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingContent, setEditingContent] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [formData, setFormData] = useState({ 
    category_id: '', title: '', description: '', youtube_url: '', order: 0 
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [contentRes, catRes] = await Promise.all([
        adminAPI.getContent(),
        adminAPI.getCategories()
      ])
      setContent(contentRes.data)
      setCategories(catRes.data)
    } catch (err) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const filteredContent = filterCategory 
    ? content.filter(c => c.category_id === parseInt(filterCategory))
    : content

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = filteredContent.findIndex((c) => c.id === active.id)
      const newIndex = filteredContent.findIndex((c) => c.id === over.id)
      const newContent = arrayMove(filteredContent, oldIndex, newIndex)
      
      // Update local state
      if (filterCategory) {
        const otherContent = content.filter(c => c.category_id !== parseInt(filterCategory))
        setContent([...otherContent, ...newContent])
      } else {
        setContent(newContent)
      }
      
      // Update order in backend
      const orders = newContent.map((item, index) => ({ id: item.id, order: index }))
      try {
        await adminAPI.reorderContent(orders)
        toast.success('Order updated')
      } catch (err) {
        toast.error('Failed to update order')
        fetchData()
      }
    }
  }

  const handleCategoryChange = async (contentId, categoryId) => {
    try {
      await adminAPI.updateContent(contentId, { category_id: categoryId })
      toast.success('Category updated')
      fetchData()
    } catch (err) {
      toast.error('Failed to update category')
    }
  }

  const handleToggleActive = async (id) => {
    try {
      await adminAPI.toggleContentActive(id)
      toast.success('Content status updated')
      fetchData()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const openModal = (item = null) => {
    if (item) {
      setEditingContent(item)
      setFormData({
        category_id: item.category_id,
        title: item.title,
        description: item.description || '',
        youtube_url: item.youtube_url,
        order: item.order || 0
      })
    } else {
      setEditingContent(null)
      setFormData({ category_id: categories[0]?.id || '', title: '', description: '', youtube_url: '', order: 0 })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingContent) {
        await adminAPI.updateContent(editingContent.id, formData)
        toast.success('Content updated')
      } else {
        await adminAPI.createContent(formData)
        toast.success('Content created')
      }
      setShowModal(false)
      fetchData()
    } catch (err) {
      toast.error('Failed to save content')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this content?')) return
    try {
      await adminAPI.deleteContent(id)
      toast.success('Content deleted')
      fetchData()
    } catch (err) {
      toast.error('Failed to delete content')
    }
  }

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat ? cat.name : 'Unknown'
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Content Management</h2>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-5 h-5" /> Add Content
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Drag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thumbnail</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredContent.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <tbody className="divide-y divide-gray-200">
                {filteredContent.map((item) => (
                  <SortableContentRow 
                    key={item.id} 
                    item={item} 
                    onEdit={openModal} 
                    onDelete={handleDelete} 
                    onToggleActive={handleToggleActive}
                    getCategoryName={getCategoryName}
                    onCategoryChange={handleCategoryChange}
                    categories={categories}
                  />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingContent ? 'Edit Content' : 'New Content'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">YouTube URL</label>
                <input
                  type="url"
                  required
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Groups Management Component
// Sortable Group Row Component
function SortableGroupRow({ group, onEdit, onDelete, onToggleActive }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? 'bg-indigo-50' : ''}>
      <td className="px-6 py-4 whitespace-nowrap">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
          <Bars3Icon className="w-5 h-5 text-gray-400" />
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-2xl">{group.icon}</td>
      <td className="px-6 py-4 whitespace-nowrap font-medium">{group.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.slug}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {group.categories?.length || 0} categories
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onToggleActive(group.id)}
          className={`px-2 py-1 rounded text-xs font-medium ${
            group.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {group.is_active ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button onClick={() => onEdit(group)} className="text-indigo-600 hover:text-indigo-900 mr-3">
          <PencilIcon className="w-5 h-5" />
        </button>
        <button onClick={() => onDelete(group.id)} className="text-red-600 hover:text-red-900">
          <TrashIcon className="w-5 h-5" />
        </button>
      </td>
    </tr>
  )
}

function GroupsManagement() {
  const [groups, setGroups] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [formData, setFormData] = useState({ name: '', slug: '', icon: '', order: 0 })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [groupsRes, catsRes] = await Promise.all([
        adminAPI.getGroups(),
        adminAPI.getCategories()
      ])
      setGroups(groupsRes.data)
      setCategories(catsRes.data)
    } catch (err) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = groups.findIndex((g) => g.id === active.id)
      const newIndex = groups.findIndex((g) => g.id === over.id)
      const newGroups = arrayMove(groups, oldIndex, newIndex)
      setGroups(newGroups)
      
      const orders = newGroups.map((g, index) => ({ id: g.id, order: index }))
      try {
        await adminAPI.reorderGroups(orders)
        toast.success('Order updated')
      } catch (err) {
        toast.error('Failed to update order')
        fetchData()
      }
    }
  }

  const openModal = (group = null) => {
    if (group) {
      setEditingGroup(group)
      setFormData({
        name: group.name,
        slug: group.slug,
        icon: group.icon || '',
        order: group.order || 0
      })
    } else {
      setEditingGroup(null)
      setFormData({ name: '', slug: '', icon: '', order: 0 })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingGroup) {
        await adminAPI.updateGroup(editingGroup.id, formData)
        toast.success('Group updated')
      } else {
        await adminAPI.createGroup(formData)
        toast.success('Group created')
      }
      setShowModal(false)
      fetchData()
    } catch (err) {
      toast.error('Failed to save group')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? Categories in this group will become ungrouped.')) return
    try {
      await adminAPI.deleteGroup(id)
      toast.success('Group deleted')
      fetchData()
    } catch (err) {
      toast.error('Failed to delete group')
    }
  }

  const handleToggleActive = async (id) => {
    try {
      await adminAPI.toggleGroupActive(id)
      toast.success('Group status updated')
      fetchData()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleCategoryGroupChange = async (categoryId, groupId) => {
    try {
      await adminAPI.updateCategory(categoryId, { group_id: groupId || null })
      toast.success('Category updated')
      fetchData()
    } catch (err) {
      toast.error('Failed to update category')
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Groups Management</h2>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-5 h-5" /> Add Group
        </button>
      </div>

      {/* Groups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Drag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categories</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
              <tbody className="divide-y divide-gray-200">
                {groups.map((group) => (
                  <SortableGroupRow 
                    key={group.id} 
                    group={group} 
                    onEdit={openModal} 
                    onDelete={handleDelete} 
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>

      {/* Category Assignment */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Assign Categories to Groups</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </span>
              <select
                value={cat.group_id || ''}
                onChange={(e) => handleCategoryGroupChange(cat.id, e.target.value ? parseInt(e.target.value) : null)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="">No Group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingGroup ? 'Edit Group' : 'New Group'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Icon (emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// User History Component
function UserHistoryManagement() {
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

// Main Admin Dashboard Component
function AdminDashboard() {
  const location = useLocation()
  const currentPath = location.pathname

  const navItems = [
    { path: '/admin', label: 'Users', icon: UsersIcon },
    { path: '/admin/groups', label: 'Groups', icon: RectangleStackIcon },
    { path: '/admin/categories', label: 'Categories', icon: FolderIcon },
    { path: '/admin/content', label: 'Content', icon: PlayCircleIcon },
    { path: '/admin/history', label: 'User History', icon: ClockIcon },
  ]

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Admin Dashboard</h2>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  currentPath === item.path
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
        <Routes>
          <Route index element={<UsersManagement />} />
          <Route path="groups" element={<GroupsManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="content" element={<ContentManagement />} />
          <Route path="history" element={<UserHistoryManagement />} />
        </Routes>
      </div>
    </div>
  )
}

export default AdminDashboard
