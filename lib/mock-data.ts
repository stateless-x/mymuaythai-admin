import type { Trainer, Gym, Tag, PrivateClass } from "./types"

export const mockTags: Tag[] = [
  // Martial Arts
  { id: "1", name: "MuayThai", category: "martial-arts", color: "#ef4444", createdDate: "2024-01-01", usageCount: 15 },
  { id: "2", name: "Boxing", category: "martial-arts", color: "#ef4444", createdDate: "2024-01-01", usageCount: 12 },
  { id: "3", name: "BJJ", category: "martial-arts", color: "#ef4444", createdDate: "2024-01-01", usageCount: 8 },
  { id: "4", name: "MMA", category: "martial-arts", color: "#ef4444", createdDate: "2024-01-01", usageCount: 10 },
  { id: "5", name: "Kickboxing", category: "martial-arts", color: "#ef4444", createdDate: "2024-01-01", usageCount: 7 },

  // Locations
  { id: "6", name: "Bangkok", category: "location", color: "#3b82f6", createdDate: "2024-01-01", usageCount: 20 },
  { id: "7", name: "Pattaya", category: "location", color: "#3b82f6", createdDate: "2024-01-01", usageCount: 8 },
  { id: "8", name: "Samui", category: "location", color: "#3b82f6", createdDate: "2024-01-01", usageCount: 5 },
  { id: "9", name: "Phuket", category: "location", color: "#3b82f6", createdDate: "2024-01-01", usageCount: 6 },
  { id: "10", name: "ChiangMai", category: "location", color: "#3b82f6", createdDate: "2024-01-01", usageCount: 4 },

  // Training Types
  {
    id: "11",
    name: "GroupClasses",
    category: "training-type",
    color: "#10b981",
    createdDate: "2024-01-01",
    usageCount: 18,
  },
  {
    id: "12",
    name: "PersonalTraining",
    category: "training-type",
    color: "#10b981",
    createdDate: "2024-01-01",
    usageCount: 14,
  },
  {
    id: "13",
    name: "SelfDefense",
    category: "training-type",
    color: "#10b981",
    createdDate: "2024-01-01",
    usageCount: 9,
  },
  {
    id: "14",
    name: "Competition",
    category: "training-type",
    color: "#10b981",
    createdDate: "2024-01-01",
    usageCount: 6,
  },

  // Levels
  { id: "15", name: "Beginner", category: "level", color: "#f59e0b", createdDate: "2024-01-01", usageCount: 16 },
  { id: "16", name: "Intermediate", category: "level", color: "#f59e0b", createdDate: "2024-01-01", usageCount: 11 },
  { id: "17", name: "Advanced", category: "level", color: "#f59e0b", createdDate: "2024-01-01", usageCount: 8 },
  { id: "18", name: "Professional", category: "level", color: "#f59e0b", createdDate: "2024-01-01", usageCount: 4 },

  // General
  { id: "19", name: "WomensOnly", category: "general", color: "#8b5cf6", createdDate: "2024-01-01", usageCount: 7 },
  { id: "20", name: "KidsClasses", category: "general", color: "#8b5cf6", createdDate: "2024-01-01", usageCount: 9 },
  { id: "21", name: "Fitness", category: "general", color: "#8b5cf6", createdDate: "2024-01-01", usageCount: 13 },
  { id: "22", name: "Wellness", category: "general", color: "#8b5cf6", createdDate: "2024-01-01", usageCount: 5 },
]

const mockPrivateClasses: PrivateClass[] = [
  {
    id: "pc1",
    name: {
      th: "การฝึกมวยไทยแบบ 1 ต่อ 1",
      en: "One-on-One Muay Thai Training",
    },
    description: {
      th: "การฝึกมวยไทยส่วนตัวที่เน้นเทคนิค การปรับสภาพร่างกาย และการฝึกกับแป้น",
      en: "Private Muay Thai training focused on technique, conditioning, and pad work",
    },
    duration: 60,
    price: 1500,
    currency: "THB",
    maxStudents: 1,
    isActive: true,
    createdDate: "2024-01-15",
  },
  {
    id: "pc2",
    name: {
      th: "เซสชันมวยส่วนตัว",
      en: "Private Boxing Session",
    },
    description: {
      th: "การฝึกมวยเข้มข้นที่เน้นพื้นฐานและเทคนิคการต่อสู้",
      en: "Intensive boxing training focused on fundamentals and fighting techniques",
    },
    duration: 45,
    price: 1200,
    currency: "THB",
    maxStudents: 1,
    isActive: true,
    createdDate: "2024-01-20",
  },
  {
    id: "pc3",
    name: {
      th: "การฝึกกลุ่มเล็ก (2-3 คน)",
      en: "Small Group Training (2-3 people)",
    },
    description: {
      th: "เซสชันการฝึกแบบกึ่งส่วนตัวสำหรับกลุ่มเล็ก เหมาะสำหรับเพื่อนหรือคู่รัก",
      en: "Semi-private training sessions for small groups, perfect for friends or couples",
    },
    duration: 60,
    price: 2000,
    currency: "THB",
    maxStudents: 3,
    isActive: true,
    createdDate: "2024-02-01",
  },
]

export const mockTrainers: Trainer[] = [
  {
    id: "1",
    firstName: {
      th: "จอห์น",
      en: "John",
    },
    lastName: {
      th: "สมิธ",
      en: "Smith",
    },
    email: "john@example.com",
    phone: "+1234567890",
    joinedDate: "2024-01-15",
    status: "active",
    assignedGym: "1",
    tags: ["MuayThai", "Bangkok", "PersonalTraining", "Advanced"],
    isFreelancer: true,
    bio: {
      th: "ครูมวยไทยมืออาชีพที่มีประสบการณ์แชมป์ เชี่ยวชาญเทคนิคแบบดั้งเดิมและวิธีการปรับสภาพร่างกายสมัยใหม่ อดีตนักสู้สนามที่มีประสบการณ์การต่อสู้มากกว่า 100 ไฟต์",
      en: "Professional Muay Thai instructor with championship experience. Specializes in traditional techniques and modern conditioning methods. Former stadium fighter with over 100 fights experience.",
    },
    yearsOfExperience: 8,
    privateClasses: mockPrivateClasses,
  },
  {
    id: "2",
    firstName: {
      th: "ซาร่าห์",
      en: "Sarah",
    },
    lastName: {
      th: "จอห์นสัน",
      en: "Johnson",
    },
    email: "sarah@example.com",
    phone: "+1234567891",
    joinedDate: "2024-02-20",
    status: "active",
    assignedGym: "2",
    tags: ["Boxing", "Pattaya", "GroupClasses", "Beginner"],
    isFreelancer: false,
    bio: {
      th: "ครูมวยที่ได้รับการรับรองและมีความหลงใหลในการสอนผู้เริ่มต้น เน้นท่าทางที่ถูกต้อง ความปลอดภัย และการสร้างความมั่นใจในสังเวียน",
      en: "Certified boxing instructor with a passion for teaching beginners. Focuses on proper form, safety, and building confidence in the ring.",
    },
    yearsOfExperience: 5,
    privateClasses: [],
  },
  {
    id: "3",
    firstName: {
      th: "ไมค์",
      en: "Mike",
    },
    lastName: {
      th: "วิลสัน",
      en: "Wilson",
    },
    email: "mike@example.com",
    phone: "+1234567892",
    joinedDate: "2024-03-10",
    status: "inactive",
    tags: ["BJJ", "Samui", "Competition", "Professional"],
    isFreelancer: true,
    bio: {
      th: "ผู้ถือเข็มขัดดำบราซิเลียน จิว-จิตสูที่มีประสบการณ์การแข่งขันระดับนานาชาติ เชี่ยวชาญเทคนิคทั้งแบบมีกิและไม่มีกิ",
      en: "Brazilian Jiu-Jitsu black belt with international competition experience. Expert in both gi and no-gi techniques.",
    },
    yearsOfExperience: 12,
    privateClasses: [
      {
        id: "pc4",
        name: {
          th: "บทเรียน BJJ ส่วนตัว",
          en: "Private BJJ Lesson",
        },
        description: {
          th: "การสอนบราซิเลียน จิว-จิตสูแบบตัวต่อตัวครอบคลุมตั้งแต่พื้นฐานถึงเทคนิคขั้นสูง",
          en: "One-on-one Brazilian Jiu-Jitsu instruction covering fundamentals to advanced techniques",
        },
        duration: 90,
        price: 2500,
        currency: "THB",
        maxStudents: 1,
        isActive: false,
        createdDate: "2024-03-10",
      },
    ],
  },
]

export const mockGyms: Gym[] = [
  {
    id: "1",
    name: {
      th: "ฟิตโซน ดาวน์ทาวน์",
      en: "FitZone Downtown",
    },
    location: {
      th: "123 ถนนใหญ่ ใจกลางเมือง",
      en: "123 Main St, Downtown",
    },
    phone: "+66 2 123 4567",
    joinedDate: "2024-01-01",
    status: "active",
    description: {
      th: "ศูนย์ออกกำลังกายสมัยใหม่ใจกลางเมืองที่มีอุปกรณ์ทันสมัยและครูฝึกมืออาชีพ",
      en: "A modern fitness center in the heart of downtown with state-of-the-art equipment and professional trainers",
    },
    googleMapUrl: "https://maps.google.com/example1",
    youtubeUrl: "https://youtube.com/watch?v=example1",
    images: [
      "/placeholder.svg?height=300&width=400&query=modern gym interior",
      "/placeholder.svg?height=300&width=400&query=gym equipment",
      "/placeholder.svg?height=300&width=400&query=fitness center",
    ],
    facilities: {
      th: ["อุปกรณ์ยกน้ำหนัก", "เครื่องออกกำลังกายแบบแอโรบิก", "คลาสกลุ่ม", "ห้องแต่งตัว", "ที่จอดรถ", "WiFi", "เครื่องปรับอากาศ"],
      en: ["Free Weights", "Cardio Equipment", "Group Classes", "Locker Rooms", "Parking", "WiFi", "Air Conditioning"],
    },
    tags: ["MuayThai", "Boxing", "Bangkok", "GroupClasses", "PersonalTraining", "Beginner", "Intermediate"],
  },
  {
    id: "2",
    name: {
      th: "พาวเวอร์ยิม นอร์ธ",
      en: "PowerGym North",
    },
    location: {
      th: "456 ถนนโอ๊ค เขตเหนือ",
      en: "456 Oak Ave, North District",
    },
    phone: "+66 2 234 5678",
    joinedDate: "2024-01-15",
    status: "active",
    description: {
      th: "เชี่ยวชาญด้านการฝึกความแข็งแกร่งและพาวเวอร์ลิฟติ้งด้วยอุปกรณ์ระดับโอลิมปิก",
      en: "Specialized in strength training and powerlifting with Olympic-grade equipment",
    },
    googleMapUrl: "https://maps.google.com/example2",
    youtubeUrl: "https://youtube.com/watch?v=example2",
    images: [
      "/placeholder.svg?height=300&width=400&query=powerlifting gym",
      "/placeholder.svg?height=300&width=400&query=weight room",
    ],
    facilities: {
      th: ["อุปกรณ์ยกน้ำหนัก", "การฝึกส่วนตัว", "ห้องแต่งตัว", "ที่จอดรถ", "เปิด 24/7"],
      en: ["Free Weights", "Personal Training", "Locker Rooms", "Parking", "24/7 Access"],
    },
    tags: ["MMA", "Kickboxing", "Pattaya", "Competition", "Advanced", "Professional"],
  },
  {
    id: "3",
    name: {
      th: "เฟล็กซ์ฟิต เซ็นเตอร์",
      en: "FlexFit Center",
    },
    location: {
      th: "789 ถนนสน ฝั่งตะวันตก",
      en: "789 Pine Rd, West Side",
    },
    phone: "+66 2 345 6789",
    joinedDate: "2024-02-01",
    status: "inactive",
    description: {
      th: "ศูนย์ออกกำลังกายครบวงจรพร้อมสระว่ายน้ำ สปา และโปรแกรมสุขภาพ",
      en: "Full-service fitness center with pool, spa, and wellness programs",
    },
    googleMapUrl: "https://maps.google.com/example3",
    youtubeUrl: "https://youtube.com/watch?v=example3",
    images: [
      "/placeholder.svg?height=300&width=400&query=fitness center with pool",
      "/placeholder.svg?height=300&width=400&query=spa wellness center",
    ],
    facilities: {
      th: ["สระว่ายน้ำ", "ซาวน่า", "ห้องอบไอน้ำ", "คลาสกลุ่ม", "สตูดิโอโยคะ", "นวดบำบัด", "ดูแลเด็ก"],
      en: ["Swimming Pool", "Sauna", "Steam Room", "Group Classes", "Yoga Studio", "Massage Therapy", "Childcare"],
    },
    tags: ["Fitness", "Wellness", "Samui", "WomensOnly", "KidsClasses", "Beginner"],
  },
]
