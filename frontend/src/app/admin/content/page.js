'use client'

import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../../services/api'
import { toast } from 'react-toastify'
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    Bars3Icon
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
                    className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${item.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

export default function ContentManagement() {
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
