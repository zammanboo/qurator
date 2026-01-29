import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoriesAPI } from '../services/api'
import { toast } from 'react-toastify'

function Home() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll()
      setCategories(response.data)
    } catch (error) {
      toast.error('Failed to load categories')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Content Categories</h1>
        <p className="mt-2 text-gray-600">
          Explore curated YouTube content across {categories.length} categories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
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

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No categories available yet.</p>
        </div>
      )}
    </div>
  )
}

export default Home
