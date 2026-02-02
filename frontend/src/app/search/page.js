'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { contentAPI } from '../../services/api'
import { analytics } from '../../services/analytics'
import { toast } from 'react-toastify'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

function SearchContent() {
    const searchParams = useSearchParams()
    const query = searchParams.get('q') || ''
    const { user } = useAuth()
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedVideo, setSelectedVideo] = useState(null)

    useEffect(() => {
        if (query) {
            searchContent()
        }
    }, [query])

    const searchContent = async () => {
        try {
            setLoading(true)
            const response = await contentAPI.search(query)
            setResults(response.data)
        } catch (err) {
            toast.error('검색 중 오류가 발생했습니다')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleVideoClick = async (item) => {
        setSelectedVideo(item)
        analytics.trackContentClick(item.id, item.title, item?.category_id)
        if (user) {
            try {
                await contentAPI.recordClick(item.id)
            } catch (err) {
                console.error('Failed to record click:', err)
            }
        }
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <MagnifyingGlassIcon className="w-8 h-8 text-indigo-600" />
                    <h1 className="text-3xl font-bold text-gray-900">검색 결과</h1>
                </div>
                <p className="text-gray-600 mt-2">
                    "{query}" 검색 결과 {results.length}개
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

            {/* Loading */}
            {loading && (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            )}

            {/* Results */}
            {!loading && results.length === 0 && query && (
                <div className="text-center py-12">
                    <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">검색 결과가 없습니다</p>
                    <Link href="/" className="text-indigo-600 hover:underline">
                        홈으로 돌아가기
                    </Link>
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {results.map((item) => (
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

export default function Search() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}>
            <SearchContent />
        </Suspense>
    )
}
