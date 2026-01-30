'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { contentAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { ClockIcon } from '@heroicons/react/24/outline'

export default function MyHistory() {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedVideo, setSelectedVideo] = useState(null)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            const response = await contentAPI.getUserHistory()
            setHistory(response.data)
        } catch (err) {
            toast.error('시청 기록을 불러오는데 실패했습니다')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return '방금 전'
        if (diffMins < 60) return `${diffMins}분 전`
        if (diffHours < 24) return `${diffHours}시간 전`
        if (diffDays < 7) return `${diffDays}일 전`
        return date.toLocaleDateString('ko-KR')
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <ClockIcon className="w-8 h-8 text-indigo-600" />
                    <h1 className="text-3xl font-bold text-gray-900">시청 기록</h1>
                </div>
                <p className="text-gray-600 mt-2">
                    내가 시청한 콘텐츠 목록입니다
                </p>
            </div>

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

            {/* History List */}
            {history.length === 0 ? (
                <div className="text-center py-12">
                    <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">아직 시청 기록이 없습니다</p>
                    <Link href="/" className="text-indigo-600 hover:underline">
                        콘텐츠 둘러보기 →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {history.map((item, index) => (
                        <div
                            key={`${item.content_id}-${index}`}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
                            onClick={() => setSelectedVideo(item)}
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
                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>{formatDate(item.clicked_at)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
