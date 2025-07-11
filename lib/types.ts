export interface Province {
  id: number
  name_th: string
  name_en: string
}

export interface Trainer {
  id: string
  first_name_th: string
  first_name_en: string
  last_name_th: string
  last_name_en: string
  email: string
  phone?: string
  bio_th?: string
  bio_en?: string
  is_active: boolean
  is_freelance: boolean
  line_id?: string
  exp_year?: number
  primaryGym?: {
    id: string
    name_th: string
    name_en: string
  }
  province?: {
    id: number
    name_th: string
    name_en: string
  }
  province_id?: number
  tags?: string[]
  classes?: any[]
  trainerClasses?: ClassData[]
  created_at: string
  updated_at?: string
  images?: (string | { id?: string; image_url: string })[]
}

export interface ClassData {
  id: string
  name: {
    th: string
    en: string
  }
  description: {
    th: string
    en: string
  }
  duration: number // in minutes
  price: number
  currency: string
  maxStudents: number
  isActive: boolean
  isPrivate?: boolean
  createdDate: string
}

export interface Gym {
  id: string
  name_th: string
  name_en: string
  description_th?: string
  description_en?: string
  phone?: string
  email?: string
  map_url?: string
  youtube_url?: string
  line_id?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  images?: (string | { id?: string; image_url: string })[]
  tags?: string[]
  associatedTrainers?: string[]
  province_id?: number
  province?: {
    id: number
    name_th: string
    name_en: string
  }
}

export interface Tag {
  id: number
  slug: string
  name_th: string
  name_en: string
  gymCount?: number
  trainerCount?: number
}

export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'staff'
  is_active: boolean
  created_at: string
  updated_at: string
}

export const FACILITY_OPTIONS = [
  "Free Weights",
  "Cardio Equipment",
  "Swimming Pool",
  "Sauna",
  "Steam Room",
  "Group Classes",
  "Personal Training",
  "Locker Rooms",
  "Parking",
  "WiFi",
  "Air Conditioning",
  "Juice Bar",
  "Towel Service",
  "24/7 Access",
  "Yoga Studio",
  "Pilates Studio",
  "Basketball Court",
  "Rock Climbing Wall",
  "Massage Therapy",
  "Childcare",
] as const

export interface TrainerWithDetails extends Omit<Trainer, 'tags' | 'images' | 'classes'> {
  classes: TrainerClassWithDetails[]
  tags: Tag[]
  images: TrainerImage[]
  primaryGym?: Gym
}

export interface TrainerClass {
  id: string
  name: string
  description: string
  duration: number
  price: number
  currency: string
  maxStudents: number
  isActive: boolean
  isPrivateClass?: boolean
  createdDate: string
  updated_at: string
}

export interface TrainerImage {
  id: string
  trainer_id: string
  image_url: string
  created_at: string
  updated_at: string
}

export interface TrainerClassWithDetails extends TrainerClass {
  class: StandardClass | null
}

export interface StandardClass {
  id: string
  name_th: string
  name_en: string
  description_th: string | null
  description_en: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'staff'
  is_active: boolean
  created_at: string
  updated_at: string
}
