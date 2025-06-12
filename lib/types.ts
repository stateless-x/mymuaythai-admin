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
  created_at: string
}

export interface PrivateClass {
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
  images?: string[]
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
  id: string
  name_th: string
  name_en: string
  description?: {
    th?: string
    en?: string
  }
  category?: "martial-arts" | "location" | "training-type" | "level" | "general"
  color: string
  createdDate?: string
  usageCount?: number
}

export const TAG_CATEGORIES = [
  { value: "martial-arts", label: "ประเภทศิลปะการต่อสู้", color: "#ef4444" },
  { value: "location", label: "สถานที่", color: "#3b82f6" },
  { value: "training-type", label: "ประเภทการฝึก", color: "#10b981" },
  { value: "level", label: "ระดับ", color: "#f59e0b" },
  { value: "general", label: "ทั่วไป", color: "#8b5cf6" },
] as const

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
