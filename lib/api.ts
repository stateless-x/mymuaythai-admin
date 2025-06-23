// API utility for MyMuayThai Backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

// Debug: Log the API base URL and current window location
console.log('API_BASE_URL:', API_BASE_URL)
console.log('Current location:', typeof window !== 'undefined' ? window.location.href : 'SSR')

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth-token")
  }
  return null
}

// Helper function for authenticated requests with automatic token refresh
const apiRequest = async (endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> => {
  const token = getAuthToken()
  
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  // Handle 401 Unauthorized - try to refresh token once
  if (response.status === 401 && retryCount === 0 && !endpoint.includes('/login') && !endpoint.includes('/refresh')) {
    try {
      const refreshToken = localStorage.getItem("refresh-token")
      if (refreshToken) {
        const refreshResponse = await fetch(`${API_BASE_URL}/api/admin-users/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        })
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          if (refreshData.success && refreshData.data) {
            localStorage.setItem("auth-token", refreshData.data.accessToken)
            localStorage.setItem("refresh-token", refreshData.data.refreshToken)
            
            // Retry the original request with new token
            return apiRequest(endpoint, options, retryCount + 1)
          }
        }
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError)
    }
    
    // If refresh failed, clear tokens and redirect to login
    localStorage.removeItem("admin-user")
    localStorage.removeItem("auth-token")
    localStorage.removeItem("refresh-token")
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
  
  // Handle non-200 responses
  if (!response.ok) {
    let errorDetails: any = null
    let rawErrorText = ''
    
    try {
      rawErrorText = await response.text()
      
      if (rawErrorText) {
        try {
          errorDetails = JSON.parse(rawErrorText)
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError)
          errorDetails = { error: rawErrorText }
        }
      }
    } catch (parseError) {
      console.error('Error reading response:', parseError)
    }

    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`API Request Failed:`, {
        url: `${API_BASE_URL}${endpoint}`,
        method: options.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        errorMessage: errorDetails?.error || 'No error message provided',
        rawResponse: rawErrorText
      })
    }

    // If backend provides an error message, use it
    if (errorDetails?.error) {
      // For rate limit errors, throw the full error object so retryAfter can be accessed
      if (response.status === 429 && errorDetails.retryAfter) {
        const rateLimitError = new Error(errorDetails.error)
        // Attach the full error details to the error object
        ;(rateLimitError as any).errorDetails = errorDetails
        throw rateLimitError
      }
      
      throw new Error(errorDetails.error)
    }

    // Fall back to status-based errors
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED')
    } else if (response.status === 403) {
      throw new Error('FORBIDDEN')
    } else if (response.status === 404) {
      throw new Error('NOT_FOUND')
    } else if (response.status >= 500) {
      throw new Error('SERVER_ERROR')
    } else {
      throw new Error('REQUEST_FAILED')
    }
  }
  
  // Handle response parsing
  const contentType = response.headers.get('content-type')
  
  try {
    if (contentType && contentType.includes('application/json')) {
      const responseText = await response.text()
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('EMPTY_RESPONSE')
      }
      
      try {
        const jsonData = JSON.parse(responseText)
        return jsonData
      } catch (jsonError: any) {
        throw new Error('INVALID_RESPONSE')
      }
    } else {
      // For non-JSON responses, return text
      const text = await response.text()
      return text ? { data: text } : { success: true }
    }
  } catch (error: any) {
    // If it's already one of our custom errors, re-throw it
    if (error.message.match(/^(EMPTY_RESPONSE|INVALID_RESPONSE|UNAUTHORIZED|FORBIDDEN|NOT_FOUND|RATE_LIMITED|SERVER_ERROR|REQUEST_FAILED)$/)) {
      throw error
    }
    // Otherwise, it's a parsing error
    throw new Error('PARSING_ERROR')
  }
}

// Gyms API
export const gymsApi = {
  // Get all gyms - uses search endpoint if searchTerm is provided
  getAll: async (params?: Record<string, any>) => {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value))
        }
      })
    }
    
    // Use search endpoint if searchTerm is provided, otherwise use regular endpoint
    const endpoint = params?.searchTerm ? `/api/gyms/search?${query.toString()}` : `/api/gyms?${query.toString()}`;
    const response = await apiRequest(endpoint);
    return response;
  },
  
  // Get gym by ID
  getById: (id: string, includeInactive: boolean = true) => {
    const params = new URLSearchParams({
      includeInactive: String(includeInactive),
    })
    return apiRequest(`/api/gyms/${id}?${params.toString()}`)
  },  

  // Create new gym
  create: (gym: any) => apiRequest("/api/gyms", {
    method: "POST",
    body: JSON.stringify(gym),
  }),
  
  // Update gym
  update: (id: string, gym: any) => apiRequest(`/api/gyms/${id}`, {
    method: "PUT",
    body: JSON.stringify(gym),
  }),
  
  // Delete gym (soft delete)
  delete: (id: string) => apiRequest(`/api/gyms/${id}`, {
    method: "DELETE",
  }),
}

// Trainers API
export const trainersApi = {
  // Get all trainers - uses search endpoint if searchTerm is provided
  getAll: async (params?: Record<string, any>) => {
    const query = new URLSearchParams()
    let endpoint: string;
    
    if (params?.searchTerm) {
      // For search, use /api/trainers/search/:query endpoint
      // Remove searchTerm from query params since it goes in the URL
      const { searchTerm, ...otherParams } = params;
      
      if (otherParams) {
        Object.entries(otherParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query.append(key, String(value))
          }
        })
      }
      
      endpoint = `/api/trainers/search/${encodeURIComponent(searchTerm)}?${query.toString()}`;
    } else {
      // For regular listing, use /api/trainers endpoint
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Map searchTerm to search parameter for trainers API
            if (key === 'searchTerm') {
              query.append('search', String(value))
            } else {
              query.append(key, String(value))
            }
          }
        })
      }
      
      endpoint = `/api/trainers?${query.toString()}`;
    }
    
    const response = await apiRequest(endpoint);
    return response;
  },
  
  // Get trainer by ID
  getById: (id: string, includeInactive: boolean = true, includeClasses: boolean = true) => {
    const params = new URLSearchParams({
      includeInactive: String(includeInactive),
      includeClasses: String(includeClasses),
    })
    return apiRequest(`/api/trainers/${id}?${params.toString()}`)
  },
  
  // Create new trainer
  create: (trainer: any) => apiRequest("/api/trainers", {
    method: "POST",
    body: JSON.stringify(trainer),
  }),
  
  // Update trainer
  update: (id: string, trainer: any) => apiRequest(`/api/trainers/${id}`, {
    method: "PUT",
    body: JSON.stringify(trainer),
  }),
  
  // Delete trainer (soft delete)
  delete: (id: string) => apiRequest(`/api/trainers/${id}`, {
    method: "DELETE",
  }),
}

// Tags API
export const tagsApi = {
  // Get all tags with pagination and search
  getAll: async (params?: Record<string, any>) => {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value))
        }
      })
    }
    
    const endpoint = `/api/tags?${query.toString()}`;
    const response = await apiRequest(endpoint);
    return response;
  },
  
  // Get tag by ID
  getById: (id: number) => apiRequest(`/api/tags/${id}`),
  
  // Create new tag
  create: (tag: any) => apiRequest("/api/tags", {
    method: "POST",
    body: JSON.stringify(tag),
  }),
  
  // Update tag
  update: (id: number, tag: any) => apiRequest(`/api/tags/${id}`, {
    method: "PUT",
    body: JSON.stringify(tag),
  }),
  
  // Delete tag
  delete: (id: number) => apiRequest(`/api/tags/${id}`, {
    method: "DELETE",
  }),
}

// Admin Users API
export const adminUsersApi = {
  // Get all admin users
  getAll: () => apiRequest("/api/admin-users"),
  
  // Get admin user by ID
  getById: (id: string) => apiRequest(`/api/admin-users/${id}`),
  
  // Create new admin user
  create: (adminUser: { email: string; password: string; role: 'admin' | 'staff' }) => 
    apiRequest("/api/admin-users", {
      method: "POST",
      body: JSON.stringify(adminUser),
    }),
  
  // Update admin user
  update: (id: string, adminUser: { 
    email?: string; 
    password?: string; 
    role?: 'admin' | 'staff'; 
    is_active?: boolean 
  }) => apiRequest(`/api/admin-users/${id}`, {
    method: "PUT",
    body: JSON.stringify(adminUser),
  }),
  
  // Delete admin user
  delete: (id: string) => apiRequest(`/api/admin-users/${id}`, {
    method: "DELETE",
  }),
  
  // Login admin user
  login: (credentials: { email: string; password: string }) => 
    apiRequest("/api/admin-users/login", {
      method: "POST", 
      body: JSON.stringify(credentials),
    }),
  
  // Refresh token
  refreshToken: (tokenData: { refreshToken: string }) => 
    apiRequest("/api/admin-users/refresh", {
      method: "POST",
      body: JSON.stringify(tokenData),
    }),

  // Logout (blacklist current token)
  logout: () => apiRequest("/api/admin-users/logout"),
  
  // Get user stats (admin count and total count)
  getUserStats: () => apiRequest("/api/admin-users/stats/count"),
}

// Provinces API (read-only)
export const provincesApi = {
  // Get all provinces
  getAll: () => apiRequest("/api/provinces"),
  
  // Get province by ID
  getById: (id: string) => apiRequest(`/api/provinces/${id}`),
}

// Health check
export const healthApi = {
  check: () => apiRequest("/api/health"),
}

// Dashboard API
export const dashboardApi = {
  // Get dashboard statistics
  getStats: () => apiRequest("/api/dashboard/stats"),
  
  // Get trainer counts by province
  getTrainersByProvince: () => apiRequest("/api/dashboard/trainers-by-province"),
  
  // Get gym counts by province
  getGymsByProvince: () => apiRequest("/api/dashboard/gyms-by-province"),
}

// Update trainer's gym association
export async function updateTrainerGym(trainerId: string, gymId: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    await apiRequest(`/api/trainers/${trainerId}`, {
      method: 'PUT',
      body: JSON.stringify({
        gym_id: gymId,
      }),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating trainer gym association:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

// Update gym with trainer associations
export async function updateGymTrainers(gymId: string, trainerIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    await apiRequest(`/api/gyms/${gymId}`, {
      method: 'PUT',
      body: JSON.stringify({
        associatedTrainers: trainerIds,
      }),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating gym trainers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

// Batch update trainers' gym associations
export async function batchUpdateTrainerGymAssociations(
  addTrainers: string[], 
  removeTrainers: string[], 
  gymId: string
): Promise<{ success: boolean; error?: string; errors?: Array<{ trainerId: string; error: string }> }> {
  const errors: Array<{ trainerId: string; error: string }> = [];

  // Add trainers to gym
  for (const trainerId of addTrainers) {
    const result = await updateTrainerGym(trainerId, gymId);
    if (!result.success) {
      errors.push({ trainerId, error: result.error || 'Failed to add trainer to gym' });
    }
  }

  // Remove trainers from gym
  for (const trainerId of removeTrainers) {
    const result = await updateTrainerGym(trainerId, null);
    if (!result.success) {
      errors.push({ trainerId, error: result.error || 'Failed to remove trainer from gym' });
    }
  }

  return {
    success: errors.length === 0,
    error: errors.length > 0 ? `${errors.length} operations failed` : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Export default for convenience
export default {
  gyms: gymsApi,
  trainers: trainersApi,
  tags: tagsApi,
  provinces: provincesApi,
  health: healthApi,
  dashboard: dashboardApi,
} 