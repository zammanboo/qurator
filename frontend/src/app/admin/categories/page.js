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
                    className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${cat.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

export default function CategoriesManagement() {
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

            const orders = newCategories.map((cat, index) => ({ id: cat.id, order: index }))
            try {
                await adminAPI.reorderCategories(orders)
                toast.success('Order updated')
            } catch (err) {
                toast.error('Failed to update order')
                fetchCategories()
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
