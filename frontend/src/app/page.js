'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { categoriesAPI, groupsAPI, contentAPI } from '../services/api'
import { analytics } from '../services/analytics'
import { toast } from 'react-toastify'
import { LockClosedIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import ProtectedRoute from '../components/ProtectedRoute'

function HomeContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ''

  const [categories, setCategories] = useState([])
  const [groups, setGroups] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      searchContent()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchContent = async () => {
    try {
      const response = await contentAPI.search(searchQuery)
      setSearchResults(response.data)
    } catch (err) {
      toast.error('검색 중 오류가 발생했습니다')
    }
  }

  const handleVideoClick = async (item) => {
    setSelectedVideo(item)
    analytics.trackContentClick(item.id, item.title, item.category_id)
    if (user) {
      try {
        await contentAPI.recordClick(item.id)
      } catch (err) {
        console.error('Failed to record click:', err)
      }
    }
  }

  const fetchData = async () => {
    try {
      const [catResponse, groupResponse] = await Promise.all([
        categoriesAPI.getAll(),
        groupsAPI.getAll()
      ])
      setCategories(catResponse.data)
      setGroups(groupResponse.data)
    } catch (error) {
      toast.error('Failed to load categories')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 비로그인 시 첫 번째 그룹의 카테고리만 표시
  const firstGroup = groups[0]
  const allowedCategoryIds = firstGroup?.categories?.map(c => c.id) || []
  const visibleCategories = user
    ? categories
    : categories.filter(c => allowedCategoryIds.includes(c.id))

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
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

      {/* 검색 결과 */}
      {searchQuery ? (
        <div>
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <MagnifyingGlassIcon className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">검색결과</h1>
            </div>
            <p className="mt-2 text-gray-600">
              "{searchQuery}" 검색 결과 {searchResults.length}개
            </p>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((item) => (
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
      ) : (
        <>
          {/* 비로그인 안내 배너 */}
          {!user && (
            <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <LockClosedIcon className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold text-lg">더 많은 콘텐츠가 기다리고 있어요!</h3>
                    <p className="text-indigo-100 text-sm">로그인하면 모든 카테고리의 콘텐츠를 볼 수 있습니다</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="px-6 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition"
                >
                  로그인하기
                </button>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Content Categories</h1>
            <p className="mt-2 text-gray-600">
              {user
                ? `Explore curated YouTube content across ${categories.length} categories`
                : `${firstGroup?.name || ''}의 콘텐츠를 둘러보세요`
              }
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleCategories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  {category.icon && (
                    <span className="text-4xl mr-4">{category.icon}</span>
                  )}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {category.name}
                  </h2>
                </div>
                {category.description && (
                  <p className="text-gray-600">{category.description}</p>
                )}
              </Link>
            ))}
          </div>

          {visibleCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No categories available yet.</p>
            </div>
          )}

          {/* 비로그인 시 추가 콘텐츠 있음 표시 */}
          {!user && categories.length > visibleCategories.length && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                <LockClosedIcon className="w-4 h-4" />
                <span>+{categories.length - visibleCategories.length}개의 카테고리가 더 있습니다</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <ProtectedRoute allowGuest>
      <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}>
        <HomeContent />
      </Suspense>
    </ProtectedRoute>
  )
}
