"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import type { Gym } from "@/lib/types"

interface GymFormStep1Props {
  gym?: Gym
  onNext: (data: Partial<Gym>) => void
  onCancel: () => void
  onSave: (data: Partial<Gym>) => Promise<void>
}

export function GymFormStep1({ gym, onNext, onCancel, onSave }: GymFormStep1Props) {
  const [formData, setFormData] = useState({
    name_th: gym?.name_th,
    name_en: gym?.name_en,
    phone: gym?.phone,
    email: gym?.email || undefined,
    description_th: gym?.description_th,
    description_en: gym?.description_en,
    map_url: gym?.map_url || undefined,
    youtube_url: gym?.youtube_url || undefined,
    line_id: gym?.line_id || undefined,
    is_active: gym?.is_active !== undefined ? gym.is_active : true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name_th || !formData.name_th.trim()) {
      newErrors.name_th = "จำเป็นต้องระบุชื่อยิมภาษาไทย"
    }

    if (!formData.name_en || !formData.name_en.trim()) {
      newErrors.name_en = "จำเป็นต้องระบุชื่อยิมภาษาอังกฤษ"
    }

    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = "จำเป็นต้องระบุเบอร์โทรศัพท์"
    }

    if (!formData.description_th || !formData.description_th.trim()) {
      newErrors.description_th = "จำเป็นต้องระบุคำอธิบายภาษาไทย"
    }

    if (!formData.description_en || !formData.description_en.trim()) {
      newErrors.description_en = "จำเป็นต้องระบุคำอธิบายภาษาอังกฤษ"
    }

    if (formData.map_url && !validateUrl(formData.map_url)) {
      newErrors.map_url = "กรุณาใส่ URL Google Maps ที่ถูกต้อง"
    }

    if (formData.youtube_url && !validateUrl(formData.youtube_url)) {
      newErrors.youtube_url = "กรุณาใส่ URL YouTube ที่ถูกต้อง"
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = "กรุณาใส่อีเมลที่ถูกต้อง"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateUrl = (url: string) => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validateEmail = (email: string) => {
    if (!email) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const formatPhoneInput = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10)
    
    if (limitedDigits.length <= 2) {
      return limitedDigits
    } else if (limitedDigits.length <= 5) {
      return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(2)}`
    } else if (limitedDigits.length <= 8) {
      return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(2, 5)}-${limitedDigits.slice(5)}`
    } else {
      // For 9+ digits, use different format
      if (limitedDigits.length === 9) {
        return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(2, 5)}-${limitedDigits.slice(5)}`
      } else {
        // For 10 digits
        return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`
      }
    }
  }

  // Helper function to clean phone number for API (remove dashes)
  const cleanPhoneForAPI = (phone: string) => {
    return phone.replace(/\D/g, '')
  }

  const handleNext = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!validateForm()) {
      console.log("Validation failed, cannot proceed")
      return
    }

    setIsSubmitting(true)
    try {
      // Clean phone number before sending to API
      const cleanedData = {
        ...formData,
        phone: formData.phone ? cleanPhoneForAPI(formData.phone) : formData.phone
      }
      await onSave(cleanedData)
      onNext(cleanedData)
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!validateForm()) {
      console.log("Validation failed, cannot save")
      return
    }

    setIsSubmitting(true)
    try {
      // Clean phone number before sending to API
      const cleanedData = {
        ...formData,
        phone: formData.phone ? cleanPhoneForAPI(formData.phone) : formData.phone
      }
      await onSave(cleanedData)
      const { toast } = await import('sonner')
      toast.success("บันทึกข้อมูลสำเร็จ", {
        description: "ข้อมูลของคุณได้รับการบันทึกแล้ว"
      })
    } catch (error) {
      console.error("Error saving:", error)
      const { toast } = await import('sonner')
      toast.error("ไม่สามารถบันทึกข้อมูลได้", {
        description: "กรุณาลองอีกครั้ง"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if we're in edit mode
  const isEditMode = !!gym

  return (
    <form onSubmit={handleNext} noValidate autoComplete="off">
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="ml-2 text-sm font-medium text-blue-600">ข้อมูลพื้นฐาน</span>
          </div>
          <div className="flex-1 h-px bg-gray-200"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="ml-2 text-sm text-gray-500">รูปภาพและสิ่งอำนวยความสะดวก</span>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ข้อมูลพื้นฐาน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gym Name - Side by side Thai/English */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gymNameTh" className="text-sm font-medium">
                  ชื่อยิม (ไทย) *
                </Label>
                <Input
                  id="gymNameTh"
                  value={formData.name_th || ""}
                  onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                  placeholder="ชื่อยิมภาษาไทย"
                  disabled={isSubmitting}
                  autoComplete="off"
                  className={`h-9 ${errors.name_th ? "border-red-500" : ""}`}
                />
                {errors.name_th && <p className="text-sm text-red-500 mt-1">{errors.name_th}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gymNameEn" className="text-sm font-medium">
                  ชื่อยิม (English) *
                </Label>
                <Input
                  id="gymNameEn"
                  value={formData.name_en || ""}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="Gym name in English"
                  disabled={isSubmitting}
                  autoComplete="off"
                  className={`h-9 ${errors.name_en ? "border-red-500" : ""}`}
                />
                {errors.name_en && <p className="text-sm text-red-500 mt-1">{errors.name_en}</p>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  เบอร์โทรศัพท์ *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })}
                  placeholder="089-123-4567"
                  disabled={isSubmitting}
                  autoComplete="off"
                  className={`h-9 ${errors.phone ? "border-red-500" : ""}`}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  อีเมล
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                  disabled={isSubmitting}
                  autoComplete="off"
                  className={`h-9 ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Line ID */}
            <div className="space-y-2">
              <Label htmlFor="lineId" className="text-sm font-medium">
                Line ID
              </Label>
              <Input
                id="lineId"
                value={formData.line_id || ""}
                onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                placeholder="gymlineid or @gymlineid"
                disabled={isSubmitting}
                autoComplete="off"
                className="h-9"
              />
            </div>

            {/* Description - Side by side Thai/English */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">คำอธิบายยิม</Label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionTh" className="text-sm text-muted-foreground">
                    คำอธิบาย (ไทย) *
                  </Label>
                  <Textarea
                    id="descriptionTh"
                    value={formData.description_th || ""}
                    onChange={(e) => setFormData({ ...formData, description_th: e.target.value })}
                    placeholder="อธิบายยิม บรรยากาศ และสิ่งที่ทำให้พิเศษ..."
                    disabled={isSubmitting}
                    autoComplete="off"
                    rows={6}
                    className={`resize-none ${errors.description_th ? "border-red-500" : ""}`}
                  />
                  {errors.description_th && <p className="text-sm text-red-500 mt-1">{errors.description_th}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn" className="text-sm text-muted-foreground">
                    คำอธิบาย (English) *
                  </Label>
                  <Textarea
                    id="descriptionEn"
                    value={formData.description_en || ""}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Describe the gym, atmosphere, and what makes it special..."
                    disabled={isSubmitting}
                    autoComplete="off"
                    rows={6}
                    className={`resize-none ${errors.description_en ? "border-red-500" : ""}`}
                  />
                  {errors.description_en && <p className="text-sm text-red-500 mt-1">{errors.description_en}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Switch
                id="status"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                disabled={isSubmitting}
              />
              <Label htmlFor="status" className="text-sm">
                เปิดใช้งาน
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* URLs and Media */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ลิงก์และสื่อ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="mapUrl" className="text-sm">
                URL Google Maps
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="mapUrl"
                  type="url"
                  value={formData.map_url || ""}
                  onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                  placeholder="https://maps.app.goo.gl/ZQnNR1DCcXvtkGyN9"
                  className={`h-9 ${errors.map_url ? "border-red-500" : ""}`}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                {formData.map_url && validateUrl(formData.map_url) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formData.map_url, "_blank")}
                    disabled={isSubmitting}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.map_url && <p className="text-sm text-red-500 mt-1">{errors.map_url}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="youtubeUrl" className="text-sm">
                URL YouTube
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="youtubeUrl"
                  type="url"
                  value={formData.youtube_url || ""}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://youtu.be/dQw4w9WgXcQ?si=XEGNd4iD9vvYgJla"
                  className={`h-9 ${errors.youtube_url ? "border-red-500" : ""}`}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                {formData.youtube_url && validateUrl(formData.youtube_url) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formData.youtube_url, "_blank")}
                    disabled={isSubmitting}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.youtube_url && <p className="text-sm text-red-500 mt-1">{errors.youtube_url}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <div className="flex gap-2">
            {/* Show save button only in edit mode */}
            {isEditMode && (
              <Button 
                type="button" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSave} 
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "กำลังดำเนินการ..." : "ถัดไป"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
