import { Tag } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface TagSearchResponse {
  success: boolean
  data: {
    items: Tag[]  // Changed from 'tags' to 'items' to match backend
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface TagResponse {
  success: boolean
  data: Tag
}

export interface TagStatsResponse {
  success: boolean
  data: (Tag & { gymCount: number, trainerCount: number })[]
}

export interface CreateTagRequest {
  name_th: string
  name_en: string
}

export interface UpdateTagRequest {
  name_th?: string
  name_en?: string
}

class TagService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = typeof window !== "undefined" ? localStorage.getItem('auth-token') : null
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Get all tags with optional pagination
  async getAllTags(params?: {
    page?: number
    pageSize?: number
  }): Promise<TagSearchResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) {
      searchParams.append('page', params.page.toString())
    }
    if (params?.pageSize) {
      searchParams.append('pageSize', params.pageSize.toString())
    }

    const url = `/api/tags${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return this.fetchWithAuth(url)
  }

  // Search tags specifically (for autocomplete/search functionality)
  async searchTags(query: string, limit: number = 20): Promise<Tag[]> {
    if (!query.trim()) {
      // If no query, get all tags
      const response = await this.getAllTags({ page: 1, pageSize: limit })
      return response.data.items || []
    }

    // Use the search endpoint
    const response = await this.fetchWithAuth(`/api/tags/search/${encodeURIComponent(query)}?pageSize=${limit}`)
    return response.data.items || []
  }

  // Get tag by ID
  async getTagById(id: number): Promise<TagResponse> {
    return this.fetchWithAuth(`/api/tags/${id}`)
  }

  // Get tag by slug
  async getTagBySlug(slug: string): Promise<TagResponse> {
    return this.fetchWithAuth(`/api/tags/slug/${slug}`)
  }

  // Create new tag
  async createTag(tagData: CreateTagRequest): Promise<TagResponse> {
    return this.fetchWithAuth('/api/tags', {
      method: 'POST',
      body: JSON.stringify(tagData),
    })
  }

  // Update tag
  async updateTag(id: number, updateData: UpdateTagRequest): Promise<TagResponse> {
    return this.fetchWithAuth(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
  }

  // Delete tag
  async deleteTag(id: number): Promise<{ success: boolean }> {
    return this.fetchWithAuth(`/api/tags/${id}`, {
      method: 'DELETE',
    })
  }

  // Get all tags with usage statistics (for admin dashboard)
  async getTagsWithStats(): Promise<(Tag & { gymCount: number, trainerCount: number })[]> {
    const response: TagStatsResponse = await this.fetchWithAuth('/api/tags/stats')
    return response.data || []
  }
}

export const tagService = new TagService()
export default tagService 