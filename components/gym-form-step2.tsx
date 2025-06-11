"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/image-upload"
import { BilingualFacilitySelector } from "@/components/bilingual-facility-selector"
import { CollapsibleTagSelector } from "@/components/collapsible-tag-selector"
import type { Gym } from "@/lib/types"

interface GymFormStep2Props {
  gym?: Gym
  initialData: Partial<Gym>
  onSubmit: (data: Omit<Gym, "id" | "joinedDate">) => void
  onBack: () => void
  onSave: (data: Partial<Gym>) => Promise<void>
}

export function GymFormStep2({ gym, initialData, onSubmit, onBack, onSave }: GymFormStep2Props) {
  const [formData, setFormData] = useState({
    ...initialData,
    images: gym?.images || [],
    facilities: gym?.facilities || { th: [], en: [] },
    tags: gym?.tags || [],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
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

    const timeoutId = setTimeout(autoSave, 2000)
    return () => clearTimeout(timeoutId)
  }, [formData, onSave])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSave(formData)
      onSubmit(formData as Omit<Gym, "id" | "joinedDate">)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            ✓
          </div>
          <span className="ml-2 text-sm font-medium text-green-600">ข้อมูลพื้นฐาน</span>
        </div>
        <div className="flex-1 h-px bg-blue-600"></div>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="ml-2 text-sm font-medium text-blue-600">รูปภาพและสิ่งอำนวยความสะดวก</span>
        </div>
      </div>

      {/* Auto-save indicator */}
      {(isSaving || lastSaved) && (
        <div className="text-sm text-muted-foreground text-right">
          {isSaving ? "กำลังบันทึก..." : `บันทึกล่าสุด: ${lastSaved?.toLocaleTimeString()}`}
        </div>
      )}

      {/* Images */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">รูปภาพยิม (Gym Images)</CardTitle>
          <p className="text-sm text-muted-foreground">
            อัปโหลดรูปภาพคุณภาพสูงของยิมได้สูงสุด 5 รูป รูปภาพจะถูกเก็บไว้ใน Bunny.net CDN
          </p>
        </CardHeader>
        <CardContent>
          <ImageUpload
            images={formData.images || []}
            onImagesChange={(images) => setFormData({ ...formData, images })}
            maxImages={5}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Facilities */}
      <BilingualFacilitySelector
        value={formData.facilities || { th: [], en: [] }}
        onChange={(facilities) => setFormData({ ...formData, facilities })}
        disabled={isSubmitting}
      />

      {/* SEO Tags */}
      <CollapsibleTagSelector
        selectedTags={formData.tags || []}
        onTagsChange={(tags) => setFormData({ ...formData, tags })}
        disabled={isSubmitting}
      />

      {/* Form Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          ย้อนกลับ
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "กำลังบันทึก..." : gym ? "อัปเดตยิม" : "สร้างยิม"}
        </Button>
      </div>
    </div>
  )
}
