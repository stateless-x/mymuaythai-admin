"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { ClassData } from "@/lib/types"

interface ClassManagerProps {
  classes: ClassData[]
  onClassesChange: (classes: ClassData[]) => void
  disabled?: boolean
}

interface ClassFormData {
  name: {
    th: string
    en: string
  }
  description: {
    th: string
    en: string
  }
  duration: string // Changed to string for better input handling
  price: string // Changed to string for better input handling
  maxStudents: string // Changed to string for better input handling
  isActive: boolean
  isPrivate: boolean // Add private class type
}

const defaultFormData: ClassFormData = {
  name: { th: "", en: "" },
  description: { th: "", en: "" },
  duration: "60",
  price: "1000",
  maxStudents: "1",
  isActive: true,
  isPrivate: true,
}

// Constants
const MAX_CLASSES_LIMIT = 3

// Helper function to validate number input
const validateNumberInput = (value: string, min: number, max: number): boolean => {
  if (value === '') return true // Allow empty for user input
  const num = Number(value)
  return !isNaN(num) && num >= min && num <= max && /^\d+$/.test(value)
}

// Form component for adding classes - moved outside to prevent re-creation
interface AddFormProps {
  formData: ClassFormData
  setFormData: React.Dispatch<React.SetStateAction<ClassFormData>>
  errors: Record<string, string>
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onMaxStudentsChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function AddForm({ formData, setFormData, errors, onPriceChange, onDurationChange, onMaxStudentsChange }: AddFormProps) {
  return (
    <div className="space-y-4">
      {/* Thai Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">🇹🇭 ข้อมูลภาษาไทย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="add-classNameTh">ชื่อคลาส (TH) *</Label>
            <Input
              id="add-classNameTh"
              value={formData.name.th}
              onChange={(e) => setFormData(prev => ({ ...prev, name: { ...prev.name, th: e.target.value } }))}
              placeholder="เช่น การฝึกมวยไทยแบบ 1 ต่อ 1"
              className={errors.nameTh ? "border-red-500" : ""}
            />
            {errors.nameTh && <p className="text-sm text-red-500 mt-1">{errors.nameTh}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-classDescriptionTh">คำอธิบาย (TH) *</Label>
            <Textarea
              id="add-classDescriptionTh"
              value={formData.description.th}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: { ...prev.description, th: e.target.value } }))
              }
              placeholder="อธิบายสิ่งที่คลาสนี้รวม..."
              rows={3}
              className={`resize-none ${errors.descriptionTh ? "border-red-500" : ""}`}
            />
            {errors.descriptionTh && <p className="text-sm text-red-500 mt-1">{errors.descriptionTh}</p>}
          </div>
        </CardContent>
      </Card>

      {/* English Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">🇬🇧 ข้อมูลภาษาอังกฤษ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="add-classNameEn">Class Name (EN) *</Label>
            <Input
              id="add-classNameEn"
              value={formData.name.en}
              onChange={(e) => setFormData(prev => ({ ...prev, name: { ...prev.name, en: e.target.value } }))}
              placeholder="e.g. One-on-One Muay Thai Training"
              className={errors.nameEn ? "border-red-500" : ""}
            />
            {errors.nameEn && <p className="text-sm text-red-500 mt-1">{errors.nameEn}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-classDescriptionEn">Description (EN) *</Label>
            <Textarea
              id="add-classDescriptionEn"
              value={formData.description.en}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: { ...prev.description, en: e.target.value } }))
              }
              placeholder="Describe what this class includes..."
              rows={3}
              className={`resize-none ${errors.descriptionEn ? "border-red-500" : ""}`}
            />
            {errors.descriptionEn && <p className="text-sm text-red-500 mt-1">{errors.descriptionEn}</p>}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Class Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="add-class-type">ประเภทคลาส</Label>
          <Select
            value={formData.isPrivate ? "private" : "group"}
            onValueChange={(value) => setFormData(prev => ({ ...prev, isPrivate: value === "private" }))}
          >
            <SelectTrigger className={errors.classType ? "border-red-500" : ""}>
              <SelectValue placeholder="เลือกประเภทคลาส" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">เรียนส่วนตัว</SelectItem>
              <SelectItem value="group">เรียนแบบกลุ่ม</SelectItem>
            </SelectContent>
          </Select>
          {errors.classType && <p className="text-sm text-red-500 mt-1">{errors.classType}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="add-duration">ระยะเวลา (นาที)</Label>
            <Input
              id="add-duration"
              type="text"
              value={formData.duration}
              onChange={onDurationChange}
              placeholder="60"
              className={errors.duration ? "border-red-500" : ""}
            />
            {errors.duration && <p className="text-sm text-red-500 mt-1">{errors.duration}</p>}
            <p className="text-xs text-muted-foreground">ช่วง 0-1440 นาที</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-max-students">นักเรียนสูงสุด</Label>
            <Input
              id="add-max-students"
              type="text"
              value={formData.maxStudents}
              onChange={onMaxStudentsChange}
              placeholder="1"
              className={errors.maxStudents ? "border-red-500" : ""}
            />
            {errors.maxStudents && <p className="text-sm text-red-500 mt-1">{errors.maxStudents}</p>}
            <p className="text-xs text-muted-foreground">ช่วง 1-99 คน</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-price">ราคา (บาท) *</Label>
          <div className="relative">
            <Input
              id="add-price"
              type="text"
              value={formData.price}
              onChange={onPriceChange}
              placeholder="1000"
              className={`pr-12 ${errors.price ? "border-red-500" : ""}`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">฿</span>
            </div>
          </div>
          {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="add-is-active"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="add-is-active">ใช้งาน (พร้อมสำหรับการจอง)</Label>
        </div>
      </div>
    </div>
  )
}

// Form component for editing classes - moved outside to prevent re-creation
interface EditFormProps {
  formData: ClassFormData
  setFormData: React.Dispatch<React.SetStateAction<ClassFormData>>
  errors: Record<string, string>
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onMaxStudentsChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function EditForm({ formData, setFormData, errors, onPriceChange, onDurationChange, onMaxStudentsChange }: EditFormProps) {
  return (
    <div className="space-y-4">
      {/* Thai Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">🇹🇭 ข้อมูลภาษาไทย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="edit-classNameTh">ชื่อคลาส (TH) *</Label>
            <Input
              id="edit-classNameTh"
              value={formData.name.th}
              onChange={(e) => setFormData(prev => ({ ...prev, name: { ...prev.name, th: e.target.value } }))}
              placeholder="เช่น การฝึกมวยไทยแบบ 1 ต่อ 1"
              className={errors.nameTh ? "border-red-500" : ""}
            />
            {errors.nameTh && <p className="text-sm text-red-500 mt-1">{errors.nameTh}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-classDescriptionTh">คำอธิบาย (TH) *</Label>
            <Textarea
              id="edit-classDescriptionTh"
              value={formData.description.th}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: { ...prev.description, th: e.target.value } }))
              }
              placeholder="อธิบายสิ่งที่คลาสนี้รวม..."
              rows={3}
              className={`resize-none ${errors.descriptionTh ? "border-red-500" : ""}`}
            />
            {errors.descriptionTh && <p className="text-sm text-red-500 mt-1">{errors.descriptionTh}</p>}
          </div>
        </CardContent>
      </Card>

      {/* English Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">🇬🇧 ข้อมูลภาษาอังกฤษ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="edit-classNameEn">Class Name (EN) *</Label>
            <Input
              id="edit-classNameEn"
              value={formData.name.en}
              onChange={(e) => setFormData(prev => ({ ...prev, name: { ...prev.name, en: e.target.value } }))}
              placeholder="e.g. One-on-One Muay Thai Training"
              className={errors.nameEn ? "border-red-500" : ""}
            />
            {errors.nameEn && <p className="text-sm text-red-500 mt-1">{errors.nameEn}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-classDescriptionEn">Description (EN) *</Label>
            <Textarea
              id="edit-classDescriptionEn"
              value={formData.description.en}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: { ...prev.description, en: e.target.value } }))
              }
              placeholder="Describe what this class includes..."
              rows={3}
              className={`resize-none ${errors.descriptionEn ? "border-red-500" : ""}`}
            />
            {errors.descriptionEn && <p className="text-sm text-red-500 mt-1">{errors.descriptionEn}</p>}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Class Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-class-type">ประเภทคลาส</Label>
          <Select
            value={formData.isPrivate ? "private" : "group"}
            onValueChange={(value) => setFormData(prev => ({ ...prev, isPrivate: value === "private" }))}
          >
            <SelectTrigger className={errors.classType ? "border-red-500" : ""}>
              <SelectValue placeholder="เลือกประเภทคลาส" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">เรียนส่วนตัว</SelectItem>
              <SelectItem value="group">เรียนแบบกลุ่ม</SelectItem>
            </SelectContent>
          </Select>
          {errors.classType && <p className="text-sm text-red-500 mt-1">{errors.classType}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-duration">ระยะเวลา (นาที)</Label>
            <Input
              id="edit-duration"
              type="text"
              value={formData.duration}
              onChange={onDurationChange}
              placeholder="60"
              className={errors.duration ? "border-red-500" : ""}
            />
            {errors.duration && <p className="text-sm text-red-500 mt-1">{errors.duration}</p>}
            <p className="text-xs text-muted-foreground">ช่วง 0-1440 นาที</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-max-students">นักเรียนสูงสุด</Label>
            <Input
              id="edit-max-students"
              type="text"
              value={formData.maxStudents}
              onChange={onMaxStudentsChange}
              placeholder="1"
              className={errors.maxStudents ? "border-red-500" : ""}
            />
            {errors.maxStudents && <p className="text-sm text-red-500 mt-1">{errors.maxStudents}</p>}
            <p className="text-xs text-muted-foreground">ช่วง 1-99 คน</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-price">ราคา (บาท) *</Label>
          <div className="relative">
            <Input
              id="edit-price"
              type="text"
              value={formData.price}
              onChange={onPriceChange}
              placeholder="1000"
              className={`pr-12 ${errors.price ? "border-red-500" : ""}`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">฿</span>
            </div>
          </div>
          {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-is-active"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="edit-is-active">ใช้งาน (พร้อมสำหรับการจอง)</Label>
        </div>
      </div>
    </div>
  )
}

export function ClassManager({ classes, onClassesChange, disabled = false }: ClassManagerProps) {
  console.log("classes", classes);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassData | null>(null)
  
  // Separate form data for add and edit operations
  const [addFormData, setAddFormData] = useState<ClassFormData>(defaultFormData)
  const [editFormData, setEditFormData] = useState<ClassFormData>(defaultFormData)
  
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  // Check if maximum classes limit is reached
  const isMaxClassesReached = classes.length >= MAX_CLASSES_LIMIT

  // Handle add button click with limit check
  const handleAddButtonClick = useCallback(() => {
    if (isMaxClassesReached) {
      toast.error(`ไม่สามารถเพิ่มคลาสได้อีก จำนวนคลาสสูงสุดคือ ${MAX_CLASSES_LIMIT} คลาส`)
      return
    }
    setIsAddDialogOpen(true)
  }, [isMaxClassesReached])

  const validateForm = useCallback((formData: ClassFormData, setErrors: (errors: Record<string, string>) => void) => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.th.trim()) {
      newErrors.nameTh = "จำเป็นต้องระบุชื่อคลาสภาษาไทย"
    }

    if (!formData.name.en.trim()) {
      newErrors.nameEn = "จำเป็นต้องระบุชื่อคลาสภาษาอังกฤษ"
    }

    if (!formData.description.th.trim()) {
      newErrors.descriptionTh = "จำเป็นต้องระบุคำอธิบายภาษาไทย"
    }

    if (!formData.description.en.trim()) {
      newErrors.descriptionEn = "จำเป็นต้องระบุคำอธิบายภาษาอังกฤษ"
    }

    if (!formData.price.trim() || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "จำเป็นต้องระบุราคาที่ถูกต้อง"
    }

    // Validate duration
    if (!formData.duration.trim()) {
      newErrors.duration = "จำเป็นต้องระบุระยะเวลา"
    } else if (!validateNumberInput(formData.duration, 0, 1440)) {
      newErrors.duration = "ระยะเวลาต้องอยู่ระหว่าง 0-1440 นาที"
    }

    // Validate max students
    if (!formData.maxStudents.trim()) {
      newErrors.maxStudents = "จำเป็นต้องระบุจำนวนนักเรียนสูงสุด"
    } else if (!validateNumberInput(formData.maxStudents, 1, 99)) {
      newErrors.maxStudents = "จำนวนนักเรียนสูงสุดต้องอยู่ระหว่าง 1-99 คน"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [])

  const handleAddPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers, no decimals
    if (value === '' || /^\d+$/.test(value)) {
      setAddFormData(prev => ({ ...prev, price: value }))
    }
  }, [])

  const handleEditPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers, no decimals
    if (value === '' || /^\d+$/.test(value)) {
      setEditFormData(prev => ({ ...prev, price: value }))
    }
  }, [])

  const handleAddDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d+$/.test(value)) {
      const num = Number(value)
      if (value === '' || (num >= 0 && num <= 1440)) {
        setAddFormData(prev => ({ ...prev, duration: value }))
      }
    }
  }, [])

  const handleEditDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d+$/.test(value)) {
      const num = Number(value)
      if (value === '' || (num >= 0 && num <= 1440)) {
        setEditFormData(prev => ({ ...prev, duration: value }))
      }
    }
  }, [])

  const handleAddMaxStudentsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d+$/.test(value)) {
      const num = Number(value)
      if (value === '' || (num >= 1 && num <= 99)) {
        setAddFormData(prev => ({ ...prev, maxStudents: value }))
      }
    }
  }, [])

  const handleEditMaxStudentsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d+$/.test(value)) {
      const num = Number(value)
      if (value === '' || (num >= 1 && num <= 99)) {
        setEditFormData(prev => ({ ...prev, maxStudents: value }))
      }
    }
  }, [])

  const handleAddClass = useCallback(() => {
    // Double-check the limit before adding
    if (classes.length >= MAX_CLASSES_LIMIT) {
      toast.error(`ไม่สามารถเพิ่มคลาสได้อีก จำนวนคลาสสูงสุดคือ ${MAX_CLASSES_LIMIT} คลาส`)
      return
    }

    if (!validateForm(addFormData, setAddErrors)) return

    const newClass: ClassData = {
      id: Date.now().toString(),
      name: addFormData.name,
      description: addFormData.description,
      duration: Number(addFormData.duration) || 60,
      price: Number(addFormData.price),
      currency: "THB",
      maxStudents: Number(addFormData.maxStudents) || 1,
      isActive: addFormData.isActive,
      isPrivate: addFormData.isPrivate,
      createdDate: new Date().toISOString().split("T")[0],
    }

    onClassesChange([...classes, newClass])
    setAddFormData({ ...defaultFormData })
    setAddErrors({})
    setIsAddDialogOpen(false)
    toast.success("เพิ่มคลาสสำเร็จ")
  }, [addFormData, classes, onClassesChange, validateForm])

  const handleEditClass = useCallback(() => {
    if (!editingClass || !validateForm(editFormData, setEditErrors)) return

    const updatedClasses = classes.map((cls) =>
      cls.id === editingClass.id
        ? {
            ...cls,
            name: editFormData.name,
            description: editFormData.description,
            duration: Number(editFormData.duration) || 60,
            price: Number(editFormData.price),
            maxStudents: Number(editFormData.maxStudents) || 1,
            isActive: editFormData.isActive,
            isPrivate: editFormData.isPrivate,
          }
        : cls,
    )

    onClassesChange(updatedClasses)
    setEditingClass(null)
    setIsEditDialogOpen(false)
    setEditFormData({ ...defaultFormData })
    setEditErrors({})
    toast.success("แก้ไขคลาสสำเร็จ")
  }, [editingClass, editFormData, classes, onClassesChange, validateForm])

  const handleDeleteClass = useCallback((classId: string) => {
    onClassesChange(classes.filter((cls) => cls.id !== classId))
    toast.success("ลบคลาสสำเร็จ")
  }, [classes, onClassesChange])

  const openEditDialog = useCallback((classData: ClassData) => {
    setEditingClass(classData)
    setEditFormData({
      name: classData.name,
      description: classData.description,
      duration: classData.duration.toString(),
      price: classData.price.toString(),
      maxStudents: classData.maxStudents.toString(),
      isActive: classData.isActive,
      isPrivate: classData.isPrivate ?? true,
    })
    setEditErrors({}) // Clear errors when opening edit dialog
    setIsEditDialogOpen(true)
  }, [])

  const closeEditDialog = useCallback(() => {
    setEditingClass(null)
    setIsEditDialogOpen(false)
    setEditFormData({ ...defaultFormData })
    setEditErrors({})
  }, [])

  const formatPrice = useCallback((price: number, currency: string) => {
    return `${price.toLocaleString()} ${currency}`
  }, [])

  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }, [])

  const getClassTypeDisplay = useCallback((isPrivate: boolean | undefined) => {
    console.log("isPrivate", isPrivate)
    return (isPrivate ? "เรียนส่วนตัว" : "เรียนแบบกลุ่ม");
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">คลาสส่วนตัวและราคา</CardTitle>
            <p className="text-sm text-muted-foreground">
              จัดการเซสชันฝึกส่วนตัวและอัตราค่าบริการของคุณ ({classes.length}/{MAX_CLASSES_LIMIT} คลาส)
            </p>
          </div>
          {!disabled && (
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open)
              if (!open) {
                setAddFormData({ ...defaultFormData })
                setAddErrors({})
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  onClick={handleAddButtonClick}
                  disabled={isMaxClassesReached}
                  className={isMaxClassesReached ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มคลาส
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>เพิ่มคลาสส่วนตัว</DialogTitle>
                </DialogHeader>
                <AddForm 
                  formData={addFormData}
                  setFormData={setAddFormData}
                  errors={addErrors}
                  onPriceChange={handleAddPriceChange}
                  onDurationChange={handleAddDurationChange}
                  onMaxStudentsChange={handleAddMaxStudentsChange}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddDialogOpen(false)
                    setAddFormData({ ...defaultFormData })
                    setAddErrors({})
                  }}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleAddClass}>
                    เพิ่มคลาส
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">ยังไม่มีคลาสส่วนตัว</p>
            <p className="text-sm text-muted-foreground mt-1">เพิ่มคลาสแรกของคุณเพื่อเริ่มต้น (สูงสุด {MAX_CLASSES_LIMIT} คลาส)</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อคลาส</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ระยะเวลา</TableHead>
                <TableHead>นักเรียนสูงสุด</TableHead>
                <TableHead>ราคา</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{c.name.th}</div>
                      <div className="text-sm text-muted-foreground">{c.name.en}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={c.isPrivate !== false ? "default" : "secondary"}
                      className={c.isPrivate !== false ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600 text-white"}
                    >
                      {getClassTypeDisplay(c.isPrivate)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDuration(c.duration)}</TableCell>
                  <TableCell>{c.maxStudents} คน</TableCell>
                  <TableCell>{formatPrice(c.price, c.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? "default" : "secondary"}>
                      {c.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Dialog open={isEditDialogOpen && editingClass?.id === c.id} onOpenChange={(open) => {
                        if (!open) {
                          closeEditDialog()
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(c)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>แก้ไขคลาสส่วนตัว</DialogTitle>
                          </DialogHeader>
                          <EditForm 
                            formData={editFormData}
                            setFormData={setEditFormData}
                            errors={editErrors}
                            onPriceChange={handleEditPriceChange}
                            onDurationChange={handleEditDurationChange}
                            onMaxStudentsChange={handleEditMaxStudentsChange}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={closeEditDialog}>
                              ยกเลิก
                            </Button>
                            <Button onClick={handleEditClass}>
                              บันทึกการแก้ไข
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
                            <AlertDialogDescription>
                              การดำเนินการนี้ไม่สามารถยกเลิกได้ คลาสนี้จะถูกลบออกจากรายการอย่างถาวร
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClass(c.id)}>
                              ลบ
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
