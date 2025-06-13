"use client"

import { useState } from "react"
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
import type { PrivateClass } from "@/lib/types"

interface PrivateClassManagerProps {
  privateClasses: PrivateClass[]
  onClassesChange: (classes: PrivateClass[]) => void
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
  duration: number
  price: string // Changed to string for better input handling
  maxStudents: number
  isActive: boolean
  isPrivateClass: boolean // Add private class type
}

export function PrivateClassManager({ privateClasses, onClassesChange, disabled = false }: PrivateClassManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<PrivateClass | null>(null)
  const [formData, setFormData] = useState<ClassFormData>({
    name: { th: "", en: "" },
    description: { th: "", en: "" },
    duration: 60,
    price: "1000",
    maxStudents: 1,
    isActive: true,
    isPrivateClass: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers, no decimals
    if (value === '' || /^\d+$/.test(value)) {
      setFormData({ ...formData, price: value })
    }
  }

  const handleAddClass = () => {
    if (!validateForm()) return

    const newClass: PrivateClass = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      duration: formData.duration,
      price: Number(formData.price),
      currency: "THB",
      maxStudents: formData.maxStudents,
      isActive: formData.isActive,
      createdDate: new Date().toISOString().split("T")[0],
    }

    onClassesChange([...privateClasses, newClass])
    resetForm()
    setIsAddDialogOpen(false)
  }

  const handleEditClass = () => {
    if (!editingClass || !validateForm()) return

    const updatedClasses = privateClasses.map((cls) =>
      cls.id === editingClass.id
        ? {
            ...cls,
            name: formData.name,
            description: formData.description,
            duration: formData.duration,
            price: Number(formData.price),
            maxStudents: formData.maxStudents,
            isActive: formData.isActive,
          }
        : cls,
    )

    onClassesChange(updatedClasses)
    setEditingClass(null)
    resetForm()
  }

  const handleDeleteClass = (classId: string) => {
    onClassesChange(privateClasses.filter((cls) => cls.id !== classId))
  }

  const openEditDialog = (privateClass: PrivateClass) => {
    setEditingClass(privateClass)
    setFormData({
      name: privateClass.name,
      description: privateClass.description,
      duration: privateClass.duration,
      price: privateClass.price.toString(),
      maxStudents: privateClass.maxStudents,
      isActive: privateClass.isActive,
      isPrivateClass: true, // Default to private for now
    })
    setErrors({}) // Clear errors when opening edit dialog
  }

  const resetForm = () => {
    setFormData({
      name: { th: "", en: "" },
      description: { th: "", en: "" },
      duration: 60,
      price: "1000",
      maxStudents: 1,
      isActive: true,
      isPrivateClass: true,
    })
    setErrors({}) // Clear errors when resetting form
  }

  const closeEditDialog = () => {
    setEditingClass(null)
    resetForm()
  }

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString()} ${currency}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }

  const ClassFormContent = () => (
    <div className="space-y-4">
      {/* Thai Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">🇹🇭 ข้อมูลภาษาไทย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="classNameTh">ชื่อคลาส (TH) *</Label>
            <Input
              id="classNameTh"
              value={formData.name.th}
              onChange={(e) => setFormData({ ...formData, name: { ...formData.name, th: e.target.value } })}
              placeholder="เช่น การฝึกมวยไทยแบบ 1 ต่อ 1"
              className={errors.nameTh ? "border-red-500" : ""}
            />
            {errors.nameTh && <p className="text-sm text-red-500 mt-1">{errors.nameTh}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="classDescriptionTh">คำอธิบาย (TH) *</Label>
            <Textarea
              id="classDescriptionTh"
              value={formData.description.th}
              onChange={(e) =>
                setFormData({ ...formData, description: { ...formData.description, th: e.target.value } })
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
            <Label htmlFor="classNameEn">Class Name (EN) *</Label>
            <Input
              id="classNameEn"
              value={formData.name.en}
              onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
              placeholder="e.g. One-on-One Muay Thai Training"
              className={errors.nameEn ? "border-red-500" : ""}
            />
            {errors.nameEn && <p className="text-sm text-red-500 mt-1">{errors.nameEn}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="classDescriptionEn">Description (EN) *</Label>
            <Textarea
              id="classDescriptionEn"
              value={formData.description.en}
              onChange={(e) =>
                setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })
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
          <Label htmlFor="class-type">ประเภทคลาส</Label>
          <Select
            value={formData.isPrivateClass ? "private" : "group"}
            onValueChange={(value) => setFormData({ ...formData, isPrivateClass: value === "private" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภทคลาส" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">เรียนส่วนตัว</SelectItem>
              <SelectItem value="group">เรียนแบบกลุ่ม</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">ระยะเวลา (นาที)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              max="180"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) || 60 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-students">นักเรียนสูงสุด</Label>
            <Input
              id="max-students"
              type="number"
              min="1"
              max="10"
              value={formData.maxStudents}
              onChange={(e) => setFormData({ ...formData, maxStudents: Number.parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">ราคา (บาท) *</Label>
          <div className="relative">
            <Input
              id="price"
              type="text"
              value={formData.price}
              onChange={handlePriceChange}
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
            id="is-active"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="is-active">ใช้งาน (พร้อมสำหรับการจอง)</Label>
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">คลาสส่วนตัวและราคา</CardTitle>
            <p className="text-sm text-muted-foreground">จัดการเซสชันฝึกส่วนตัวและอัตราค่าบริการของคุณ</p>
          </div>
          {!disabled && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มคลาส
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>เพิ่มคลาสส่วนตัว</DialogTitle>
                </DialogHeader>
                <ClassFormContent />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddDialogOpen(false)
                    resetForm()
                  }}>
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleAddClass}
                  >
                    เพิ่มคลาส
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {privateClasses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">ยังไม่มีคลาสส่วนตัว</p>
            <p className="text-sm text-muted-foreground mt-1">เพิ่มคลาสแรกของคุณเพื่อเริ่มต้น</p>
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
              {privateClasses.map((privateClass) => (
                <TableRow key={privateClass.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{privateClass.name.th}</div>
                      <div className="text-sm text-muted-foreground">{privateClass.name.en}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">เรียนส่วนตัว</Badge>
                  </TableCell>
                  <TableCell>{formatDuration(privateClass.duration)}</TableCell>
                  <TableCell>{privateClass.maxStudents} คน</TableCell>
                  <TableCell>{formatPrice(privateClass.price, privateClass.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={privateClass.isActive ? "default" : "secondary"}>
                      {privateClass.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(privateClass)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>แก้ไขคลาสส่วนตัว</DialogTitle>
                          </DialogHeader>
                          <ClassFormContent />
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
                            <AlertDialogAction onClick={() => handleDeleteClass(privateClass.id)}>
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
