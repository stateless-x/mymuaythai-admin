// API utility for MyMuayThai Backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth-token")
  }
  return null
}

// Helper function for authenticated requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
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
  
  if (!response.ok) {
    let errorDetails
    try {
      errorDetails = await response.json()
    } catch {
      errorDetails = await response.text()
    }
    
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetails)}`)
  }
  
  return response.json()
}

// Gyms API
export const gymsApi = {
  // Get all gyms
  getAll: async () => {
    const params = new URLSearchParams({  
      includeInactive: "true",
      page: "1",
      pageSize: "20",
    })
    const response = await apiRequest(`/api/gyms?${params.toString()}`);
    return response.data || response;
  },
  
  // Get gym by ID
  getById: (id: string) => {
    const params = new URLSearchParams({
      includeInactive: "true",
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
  // Get all trainers
  getAll: async () => {
    const params = new URLSearchParams({
      includeInactive: "true",
      includeClasses: "true",
      page: "1",
      pageSize: "20",
    })
    const response = await apiRequest(`/api/trainers?${params.toString()}`);
    return response.data || response; // Handle potential data property
  },
  
  // Get trainer by ID
  getById: (id: string) => {
    const params = new URLSearchParams({
      includeInactive: "true",
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
  // Get all tags
  getAll: async () => {
    const response = await apiRequest("/api/tags");
    return response.data?.items || response.data || response;
  },
  
  // Get tag by ID
  getById: (id: string) => apiRequest(`/api/tags/${id}`),
  
  // Create new tag
  create: (tag: any) => apiRequest("/api/tags", {
    method: "POST",
    body: JSON.stringify(tag),
  }),
  
  // Update tag
  update: (id: string, tag: any) => apiRequest(`/api/tags/${id}`, {
    method: "PUT",
    body: JSON.stringify(tag),
  }),
  
  // Delete tag
  delete: (id: string) => apiRequest(`/api/tags/${id}`, {
    method: "DELETE",
  }),
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
} 