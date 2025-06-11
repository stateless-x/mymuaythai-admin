export interface Trainer {
  id: string
  firstName: {
    th: string
    en: string
  }
  lastName: {
    th: string
    en: string
  }
  email: string
  phone?: string
  joinedDate: string
  status: "active" | "inactive"
  assignedGym?: string
  tags?: string[]
  isFreelancer: boolean
  bio?: {
    th: string
    en: string
  }
  yearsOfExperience: number
  privateClasses?: PrivateClass[]
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
  name: {
    th: string
    en: string
  }
  location: {
    th: string
    en: string
  }
  phone?: string
  joinedDate: string
  status: "active" | "inactive"
  description?: {
    th: string
    en: string
  }
  googleMapUrl?: string
  youtubeUrl?: string
  images?: string[]
  facilities?: {
    th: string[]
    en: string[]
  }
  tags?: string[]
}

export interface Tag {
  id: string
  name: string
  category: "martial-arts" | "location" | "training-type" | "level" | "general"
  color: string
  createdDate: string
  usageCount: number
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
