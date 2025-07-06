"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trainer } from "@/lib/types"
import { 
  validateFormData, 
  formatPhoneInput, 
  cleanFormDataForAPI,
  validateEmail 
} from "@/lib/utils/form-helpers"

interface TrainerFormStep1Props {
  trainer?: Partial<Trainer>
  onNext: (data: Partial<Trainer>) => void
  onCancel: () => void
  onSave: (data: Partial<Trainer>) => Promise<void>
  onSuccess: () => void
}

export function TrainerFormStep1({ trainer, onNext, onCancel, onSave, onSuccess }: TrainerFormStep1Props) {
  const [formData, setFormData] = useState({
    first_name_th: trainer?.first_name_th || "",
    last_name_th: trainer?.last_name_th || "",
    first_name_en: trainer?.first_name_en || "",
    last_name_en: trainer?.last_name_en || "",
    bio_th: trainer?.bio_th || "",
    bio_en: trainer?.bio_en || "",
    phone: trainer?.phone || "",
    email: trainer?.email || "",
    line_id: trainer?.line_id || "",
    exp_year: trainer?.exp_year || 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setFormData({
      first_name_th: trainer?.first_name_th || "",
      last_name_th: trainer?.last_name_th || "",
      first_name_en: trainer?.first_name_en || "",
      last_name_en: trainer?.last_name_en || "",
      bio_th: trainer?.bio_th || "",
      bio_en: trainer?.bio_en || "",
      phone: trainer?.phone || "",
      email: trainer?.email || "",
      line_id: trainer?.line_id || "",
      exp_year: trainer?.exp_year || 0,
    })
  }, [trainer])

  const validateForm = () => {
    const requiredFields = [
      'first_name_th', 'last_name_th', 'first_name_en', 'last_name_en',
      'phone', 'bio_th', 'bio_en'
    ]
    
    const formErrors = validateFormData(formData, requiredFields)

    if (formData.email && !validateEmail(formData.email)) {
      formErrors.email = "กรุณาใส่อีเมลที่ถูกต้อง"
    }

    if (formData.exp_year < 0 || formData.exp_year > 99) {
      formErrors.exp_year = "ประสบการณ์ต้องอยู่ระหว่าง 0 ถึง 99 ปี"
    }

    setErrors(formErrors)
    return Object.keys(formErrors).length === 0
  }

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!validateForm()) return
    const cleanedData = cleanFormDataForAPI(formData)
    onNext(cleanedData)
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const cleanedData = cleanFormDataForAPI(formData)
      await onSave(cleanedData)
      const { toast } = await import('sonner')
      toast.success("บันทึกข้อมูลสำเร็จ", { description: "ข้อมูลของคุณได้รับการบันทึกแล้ว" })
      onSuccess()
    } catch (error) {
      console.error("Error saving:", error)
      const { toast } = await import('sonner')
      toast.error("ไม่สามารถบันทึกข้อมูลได้", { description: "กรุณาลองอีกครั้ง" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditMode = !!trainer?.id

  return (
    <form onSubmit={handleNext} noValidate autoComplete="off" className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-md font-medium">1</div>
          <span className="ml-2 text-md font-medium text-blue-600">ข้อมูลพื้นฐาน</span>
        </div>
        <div className="flex-1 h-px bg-gray-200"></div>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-md font-medium">2</div>
          <span className="ml-2 text-md text-gray-500">ข้อมูลเพิ่มเติม</span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center">🇹🇭 ข้อมูลภาษาไทย</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstNameTh" className="text-sm">ชื่อ (TH) *</Label>
              <Input id="firstNameTh" value={formData.first_name_th} onChange={(e) => setFormData({ ...formData, first_name_th: e.target.value })} placeholder="ชื่อภาษาไทย" disabled={isSubmitting} className={`h-9 ${errors.first_name_th ? "border-red-500" : ""}`} />
              {errors.first_name_th && <p className="text-sm text-red-500 mt-1">{errors.first_name_th}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastNameTh" className="text-sm">นามสกุล (TH) *</Label>
              <Input id="lastNameTh" value={formData.last_name_th} onChange={(e) => setFormData({ ...formData, last_name_th: e.target.value })} placeholder="นามสกุลภาษาไทย" disabled={isSubmitting} className={`h-9 ${errors.last_name_th ? "border-red-500" : ""}`} />
              {errors.last_name_th && <p className="text-sm text-red-500 mt-1">{errors.last_name_th}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="bioTh" className="text-sm">ประวัติ / คำอธิบาย (TH) *</Label>
            <Textarea id="bioTh" value={formData.bio_th} onChange={(e) => setFormData({ ...formData, bio_th: e.target.value })} placeholder="บอกเราเกี่ยวกับประวัติ ความเชี่ยวชาญ..." rows={3} disabled={isSubmitting} className={`resize-none ${errors.bio_th ? "border-red-500" : ""}`} />
            {errors.bio_th && <p className="text-sm text-red-500 mt-1">{errors.bio_th}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center">🇬🇧 ข้อมูลภาษาอังกฤษ</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstNameEn" className="text-sm">First Name (EN) *</Label>
              <Input id="firstNameEn" value={formData.first_name_en} onChange={(e) => setFormData({ ...formData, first_name_en: e.target.value })} placeholder="First name" disabled={isSubmitting} className={`h-9 ${errors.first_name_en ? "border-red-500" : ""}`} />
              {errors.first_name_en && <p className="text-sm text-red-500 mt-1">{errors.first_name_en}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastNameEn" className="text-sm">Last Name (EN) *</Label>
              <Input id="lastNameEn" value={formData.last_name_en} onChange={(e) => setFormData({ ...formData, last_name_en: e.target.value })} placeholder="Last name" disabled={isSubmitting} className={`h-9 ${errors.last_name_en ? "border-red-500" : ""}`} />
              {errors.last_name_en && <p className="text-sm text-red-500 mt-1">{errors.last_name_en}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="bioEn" className="text-sm">Description (EN) *</Label>
            <Textarea id="bioEn" value={formData.bio_en} onChange={(e) => setFormData({ ...formData, bio_en: e.target.value })} placeholder="Your background, expertise, and training philosophy..." rows={3} disabled={isSubmitting} className={`resize-none ${errors.bio_en ? "border-red-500" : ""}`} />
            {errors.bio_en && <p className="text-sm text-red-500 mt-1">{errors.bio_en}</p>}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">ข้อมูลทั่วไป</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm">อีเมล</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={isSubmitting} className={`h-9 ${errors.email ? "border-red-500" : ""}`} placeholder="user@example.com" />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-sm">เบอร์โทร *</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })} disabled={isSubmitting} placeholder="081-234-5678" className={`h-9 ${errors.phone ? "border-red-500" : ""}`} />
              {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="lineId" className="text-sm">Line ID</Label>
              <Input id="lineId" value={formData.line_id} onChange={(e) => setFormData({ ...formData, line_id: e.target.value })} placeholder="@lineid or lineid" disabled={isSubmitting} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="experience" className="text-sm">ปีของประสบการณ์ *</Label>
              <Input id="experience" type="number" value={formData.exp_year} onChange={(e) => setFormData({ ...formData, exp_year: Number(e.target.value) })} placeholder="0-99" disabled={isSubmitting} className={`h-9 ${errors.exp_year ? "border-red-500" : ""}`} />
              {errors.exp_year && <p className="text-sm text-red-500 mt-1">{errors.exp_year}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>ยกเลิก</Button>
        <div className="flex gap-2">
          {isEditMode && (
            <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "กำลังดำเนินการ..." : "ถัดไป"}
          </Button>
        </div>
      </div>
    </form>
  )
} 