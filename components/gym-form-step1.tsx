"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    name: gym?.name || { th: "", en: "" },
    location: gym?.location || { th: "", en: "" },
    phone: gym?.phone || "",
    description: gym?.description || { th: "", en: "" },
    googleMapUrl: gym?.googleMapUrl || "",
    youtubeUrl: gym?.youtubeUrl || "",
    status: gym?.status || "active",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (formData.name.th.trim() || formData.name.en.trim()) {
        setIsSaving(true)
        try {
          await onSave(formData)
          setLastSaved(new Date())
        } catch (error) {
          console.error("Auto-save failed:", error)
        } finally {
          setIsSaving(false)
        }
      }
    }

    const timeoutId = setTimeout(autoSave, 2000)
    return () => clearTimeout(timeoutId)
  }, [formData, onSave])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.th.trim()) {
      newErrors.name = "จำเป็นต้องระบุชื่อยิมภาษาไทย"
    }

    if (!formData.location.th.trim()) {
      newErrors.location = "จำเป็นต้องระบุที่อยู่ภาษาไทย"
    }

    if (formData.googleMapUrl && !validateUrl(formData.googleMapUrl)) {
      newErrors.googleMapUrl = "กรุณาใส่ URL Google Maps ที่ถูกต้อง"
    }

    if (formData.youtubeUrl && !validateUrl(formData.youtubeUrl)) {
      newErrors.youtubeUrl = "กรุณาใส่ URL YouTube ที่ถูกต้อง"
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

  const handleNext = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
      onNext(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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

      {/* Auto-save indicator */}
      {(isSaving || lastSaved) && (
        <div className="text-sm text-muted-foreground text-right">
          {isSaving ? "กำลังบันทึก..." : `บันทึกล่าสุด: ${lastSaved?.toLocaleTimeString()}`}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ข้อมูลพื้นฐาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gym Name - Bilingual Tabs */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              ชื่อยิม *{errors.name && <span className="text-red-500 ml-2">{errors.name}</span>}
            </Label>
            <Tabs defaultValue="th" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="th">🇹🇭 ไทย</TabsTrigger>
                <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
              </TabsList>

              <TabsContent value="th">
                <div className="space-y-2">
                  <Label htmlFor="gymNameTh">ชื่อยิม (TH) *</Label>
                  <Input
                    id="gymNameTh"
                    value={formData.name.th}
                    onChange={(e) => setFormData({ ...formData, name: { ...formData.name, th: e.target.value } })}
                    placeholder="ชื่อยิมภาษาไทย"
                    disabled={isSubmitting}
                    className="h-9"
                  />
                </div>
              </TabsContent>

              <TabsContent value="en">
                <div className="space-y-2">
                  <Label htmlFor="gymNameEn">Gym Name (EN)</Label>
                  <Input
                    id="gymNameEn"
                    value={formData.name.en}
                    onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                    placeholder="Gym name in English"
                    disabled={isSubmitting}
                    className="h-9"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Location - Bilingual Tabs */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              ที่อยู่ *{errors.location && <span className="text-red-500 ml-2">{errors.location}</span>}
            </Label>
            <Tabs defaultValue="th" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="th">🇹🇭 ไทย</TabsTrigger>
                <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
              </TabsList>

              <TabsContent value="th">
                <div className="space-y-2">
                  <Label htmlFor="locationTh">ที่อยู่ (TH) *</Label>
                  <Textarea
                    id="locationTh"
                    value={formData.location.th}
                    onChange={(e) =>
                      setFormData({ ...formData, location: { ...formData.location, th: e.target.value } })
                    }
                    placeholder="ที่อยู่เต็มภาษาไทย"
                    disabled={isSubmitting}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="en">
                <div className="space-y-2">
                  <Label htmlFor="locationEn">Address (EN)</Label>
                  <Textarea
                    id="locationEn"
                    value={formData.location.en}
                    onChange={(e) =>
                      setFormData({ ...formData, location: { ...formData.location, en: e.target.value } })
                    }
                    placeholder="Full address in English"
                    disabled={isSubmitting}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-sm">
              เบอร์โทรศัพท์
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+66 2 123 4567"
              disabled={isSubmitting}
              className="h-9"
            />
          </div>

          {/* Description - Bilingual Tabs */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">คำอธิบาย</Label>
            <Tabs defaultValue="th" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="th">🇹🇭 ไทย</TabsTrigger>
                <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
              </TabsList>

              <TabsContent value="th">
                <div className="space-y-2">
                  <Label htmlFor="descriptionTh">คำอธิบาย (TH)</Label>
                  <Textarea
                    id="descriptionTh"
                    value={formData.description.th}
                    onChange={(e) =>
                      setFormData({ ...formData, description: { ...formData.description, th: e.target.value } })
                    }
                    placeholder="อธิบายยิม บรรยากาศ และสิ่งที่ทำให้พิเศษ..."
                    disabled={isSubmitting}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="en">
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">Description (EN)</Label>
                  <Textarea
                    id="descriptionEn"
                    value={formData.description.en}
                    onChange={(e) =>
                      setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })
                    }
                    placeholder="Describe the gym, atmosphere, and what makes it special..."
                    disabled={isSubmitting}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Switch
              id="status"
              checked={formData.status === "active"}
              onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? "active" : "inactive" })}
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
            <Label htmlFor="googleMapUrl" className="text-sm">
              URL Google Maps
            </Label>
            <div className="flex space-x-2">
              <Input
                id="googleMapUrl"
                type="url"
                value={formData.googleMapUrl}
                onChange={(e) => setFormData({ ...formData, googleMapUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
                className={`h-9 ${!validateUrl(formData.googleMapUrl) ? "border-red-500" : ""}`}
                disabled={isSubmitting}
              />
              {formData.googleMapUrl && validateUrl(formData.googleMapUrl) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(formData.googleMapUrl, "_blank")}
                  disabled={isSubmitting}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!validateUrl(formData.googleMapUrl) && formData.googleMapUrl && (
              <p className="text-sm text-red-500">กรุณาใส่ URL ที่ถูกต้อง</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="youtubeUrl" className="text-sm">
              URL YouTube
            </Label>
            <div className="flex space-x-2">
              <Input
                id="youtubeUrl"
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className={`h-9 ${!validateUrl(formData.youtubeUrl) ? "border-red-500" : ""}`}
                disabled={isSubmitting}
              />
              {formData.youtubeUrl && validateUrl(formData.youtubeUrl) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(formData.youtubeUrl, "_blank")}
                  disabled={isSubmitting}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!validateUrl(formData.youtubeUrl) && formData.youtubeUrl && (
              <p className="text-sm text-red-500">กรุณาใส่ URL ที่ถูกต้อง</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          ยกเลิก
        </Button>
        <Button onClick={handleNext} disabled={isSubmitting}>
          {isSubmitting ? "กำลังบันทึก..." : "ถัดไป"}
        </Button>
      </div>
    </div>
  )
}
