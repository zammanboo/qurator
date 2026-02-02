'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { categoriesAPI, contentAPI, adminAPI, groupsAPI } from '../../../services/api'
import { analytics } from '../../../services/analytics'
import { toast } from 'react-toastify'
import { PlusIcon, LockClosedIcon } from '@heroicons/react/24/outline'

export default function CategoryView() {
    const params = useParams()
    const slug = params.slug
    const { user } = useAuth()
    const router = useRouter()
    const [category, setCategory] = useState(null)
    const [content, setContent] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [accessDenied, setAccessDenied] = useState(false)
    const [selectedVideo, setSelectedVideo] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [formData, setFormData] = useState({ youtube_url: '', title: '', description: '', order: 0 })
    const [submitting, setSubmitting] = useState(false)

    const handleVideoClick = async (item) => {
        setSelectedVideo(item)
        analytics.trackContentClick(item.id, item.title, item.category_id)

        // Record click only if logged in
        if (user) {
            try {
                await contentAPI.recordClick(item.id)
                // Update local click count
                setContent(prev => prev.map(c =>
                    c.id === item.id ? { ...c, click_count: (c.click_count || 0) + 1 } : c
                ))
            } catch (err) {
                console.error('Failed to record click:', err)
            }
        }
    }

    useEffect(() => {
        fetchCategoryAndContent()
    }, [slug, user])

    const fetchCategoryAndContent = async () => {
        try {
            setLoading(true)
            setAccessDenied(false)

            // 비로그인 시 첫 번째 그룹 카테고리만 허용
            if (!user) {
                const groupsResponse = await groupsAPI.getAll()
                const firstGroup = groupsResponse.data[0]
                const allowedSlugs = firstGroup?.categories?.map(c => c.slug) || []

                if (!allowedSlugs.includes(slug)) {
                    setAccessDenied(true)
                    setLoading(false)
                    return
                }
            }

            const categoryResponse = await categoriesAPI.getBySlug(slug)
            setCategory(categoryResponse.data)

            const contentResponse = await contentAPI.getAll(categoryResponse.data.id)
            setContent(contentResponse.data)
        } catch (err) {
            setError('Failed to load category content')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddContent = async (e) => {
        e.preventDefault()
        if (!formData.youtube_url) {
            toast.error('YouTube URL을 입력해주세요')
            return
        }

        try {
            setSubmitting(true)
            await adminAPI.createContent({
                ...formData,
                category_id: category.id
            })
            toast.success('콘텐츠가 추가되었습니다!')
            setShowAddModal(false)
            setFormData({ youtube_url: '', title: '', description: '', order: 0 })
            fetchCategoryAndContent()
        } catch (err) {
            toast.error('콘텐츠 추가 실패')
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (accessDenied) {
        return (
            <div className="text-center py-12">
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
                    <LockClosedIcon className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
                    <p className="text-gray-600 mb-6">
                        이 카테고리의 콘텐츠를 보려면 로그인이 필요합니다.
                        <br />로그인하면 모든 콘텐츠를 자유롭게 즐길 수 있어요!
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                        >
                            로그인하기
                        </button>
                        <Link
                            href="/"
                            className="block w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                        >
                            홈으로 돌아가기
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !category) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error || 'Category not found'}</p>
                <Link href="/" className="text-indigo-600 hover:underline">
                    ← Back to Home
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Category Header */}
            <div className="mb-8">
                <Link href="/" className="text-indigo-600 hover:underline text-sm mb-2 inline-block">
                    ← Back to Categories
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {category.icon && <span className="text-3xl">{category.icon}</span>}
                        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
                    </div>
                    {user?.is_admin && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            <PlusIcon className="w-5 h-5" />
                            콘텐츠 추가
                        </button>
                    )}
                </div>
                {category.description && (
                    <p className="text-gray-600 mt-2">{category.description}</p>
                )}
            </div>

            {/* Add Content Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">새 콘텐츠 추가</h3>
                        <form onSubmit={handleAddContent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">YouTube URL *</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.youtube_url}
                                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">URL만 입력하면 제목과 썸네일이 자동으로 가져와집니다</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">제목 (선택)</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="비워두면 자동으로 가져옵니다"
                                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">설명 (선택)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">순서</label>
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
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {submitting ? '추가 중...' : '추가'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Video Player Modal */}
            {selectedVideo && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedVideo(null)}
                >
                    <div
                        className="bg-white rounded-lg overflow-hidden max-w-4xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative pt-[56.25%]">
                            <iframe
                                className="absolute inset-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${selectedVideo.youtube_id}?autoplay=1`}
                                title={selectedVideo.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                            {selectedVideo.description && (
                                <p className="text-gray-600 mt-2 text-sm">{selectedVideo.description}</p>
                            )}
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Grid */}
            {content.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p>아직 콘텐츠가 없습니다.</p>
                    {user?.is_admin && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 text-indigo-600 hover:underline"
                        >
                            + 첫 번째 콘텐츠 추가하기
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {content.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
                            onClick={() => handleVideoClick(item)}
                        >
                            <div className="relative pt-[56.25%]">
                                <img
                                    src={item.thumbnail_url || `https://img.youtube.com/vi/${item.youtube_id}/mqdefault.jpg`}
                                    alt={item.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition flex items-center justify-center">
                                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center opacity-80">
                                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-gray-900 line-clamp-2">{item.title}</h3>
                                {item.description && (
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                )}
                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>{item.click_count || 0} views</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
