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
                    className={`px-2 py-1 rounded text-xs font-medium ${group.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
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

export default function GroupsManagement() {
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
