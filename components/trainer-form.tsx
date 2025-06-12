"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Trainer } from "@/lib/types"
import { mockGyms } from "@/lib/mock-data"
import { PrivateClassManager } from "@/components/private-class-manager"
import { CollapsibleTagSelector } from "@/components/collapsible-tag-selector"

interface TrainerFormProps {
  trainer?: Trainer
  onSubmit: (trainer: Omit<Trainer, "id" | "joinedDate">) => void
  onCancel: () => void
}

export function TrainerForm({ trainer, onSubmit, onCancel }: TrainerFormProps) {
  const [formData, setFormData] = useState({
    firstName: trainer?.firstName || { th: "", en: "" },
    lastName: trainer?.lastName || { th: "", en: "" },
    email: trainer?.email || "",
    phone: trainer?.phone || "",
    status: trainer?.status || "active",
    assignedGym: trainer?.assignedGym || "",
    tags: trainer?.tags || [],
    isFreelancer: trainer?.isFreelancer || false,
    bio: trainer?.bio || { th: "", en: "" },
    yearsOfExperience: trainer?.yearsOfExperience || 0,
    privateClasses: trainer?.privateClasses || [],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.th.trim()) {
      newErrors.firstName = "จำเป็นต้องระบุชื่อภาษาไทย"
    }

    if (!formData.lastName.th.trim()) {
      newErrors.lastName = "จำเป็นต้องระบุนามสกุลภาษาไทย"
    }

    if (!formData.email.trim()) {
      newErrors.email = "จำเป็นต้องระบุอีเมล"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "กรุณาใส่อีเมลที่ถูกต้อง"
    }

    if (formData.yearsOfExperience < 0 || formData.yearsOfExperience > 50) {
      newErrors.yearsOfExperience = "ประสบการณ์ต้องอยู่ระหว่าง 0 ถึง 50 ปี"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(formData as Omit<Trainer, "id" | "joinedDate">)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <ScrollArea className="h-[85vh] w-full">
        <div className="px-6 pr-16 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Thai Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">🇹🇭 ข้อมูลภาษาไทย (Thai Information)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="firstNameTh" className="text-sm">
                      ชื่อ (TH) *
                    </Label>
                    <Input
                      id="firstNameTh"
                      value={formData.firstName.th}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: { ...formData.firstName, th: e.target.value } })
                      }
                      placeholder="ชื่อภาษาไทย"
                      disabled={isSubmitting}
                      className="h-9 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lastNameTh" className="text-sm">
                      นามสกุล (TH) *
                    </Label>
                    <Input
                      id="lastNameTh"
                      value={formData.lastName.th}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: { ...formData.lastName, th: e.target.value } })
                      }
                      placeholder="นามสกุลภาษาไทย"
                      disabled={isSubmitting}
                      className="h-9 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bioTh" className="text-sm">
                    ประวัติ / คำอธิบาย (TH)
                  </Label>
                  <Textarea
                    id="bioTh"
                    value={formData.bio.th}
                    onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, th: e.target.value } })}
                    placeholder="บอกเราเกี่ยวกับประวัติ ความเชี่ยวชาญ และปรัชญาการฝึกของคุณ..."
                    rows={3}
                    disabled={isSubmitting}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* English Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">🇬🇧 ข้อมูลภาษาอังกฤษ (English Information)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="firstNameEn" className="text-sm">
                      First Name (EN)
                    </Label>
                    <Input
                      id="firstNameEn"
                      value={formData.firstName.en}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: { ...formData.firstName, en: e.target.value } })
                      }
                      placeholder="First name in English"
                      disabled={isSubmitting}
                      className="h-9 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lastNameEn" className="text-sm">
                      Last Name (EN)
                    </Label>
                    <Input
                      id="lastNameEn"
                      value={formData.lastName.en}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: { ...formData.lastName, en: e.target.value } })
                      }
                      placeholder="Last name in English"
                      disabled={isSubmitting}
                      className="h-9 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bioEn" className="text-sm">
                    Description (EN)
                  </Label>
                  <Textarea
                    id="bioEn"
                    value={formData.bio.en}
                    onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, en: e.target.value } })}
                    placeholder="Tell us about your background, expertise, and training philosophy..."
                    rows={3}
                    disabled={isSubmitting}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* General Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ข้อมูลทั่วไป (General Information)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-sm">
                      อีเมล *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={isSubmitting}
                      className="h-9 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-sm">
                      เบอร์โทร
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={isSubmitting}
                      className="h-9 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="experience" className="text-sm">
                    ปีของประสบการณ์
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsOfExperience}
                    onChange={(e) =>
                      setFormData({ ...formData, yearsOfExperience: Number.parseInt(e.target.value) || 0 })
                    }
                    disabled={isSubmitting}
                    className="h-9 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.yearsOfExperience && <p className="text-sm text-red-500 mt-1">{errors.yearsOfExperience}</p>}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <Switch
                    id="status"
                    checked={formData.status === "active"}
                    onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? "active" : "inactive" })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="status" className="text-sm">
                    สถานะเปิดใช้งาน
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ข้อมูลการจ้างงาน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="freelancer"
                    checked={formData.isFreelancer}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFreelancer: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="freelancer" className="text-sm">
                    ฟรีแลนซ์
                  </Label>
                  <span className="text-xs text-muted-foreground">(สามารถจัดการคลาสส่วนตัวและกำหนดราคาเองได้)</span>
                </div>

                {!formData.isFreelancer && (
                  <div className="space-y-1">
                    <Label htmlFor="gym" className="text-sm">
                      ยิมที่มอบหมาย
                    </Label>
                    <Select
                      value={formData.assignedGym}
                      onValueChange={(value) => setFormData({ ...formData, assignedGym: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="เลือกยิม" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-gym">ไม่ได้มอบหมายยิม</SelectItem>
                        {mockGyms
                          .filter((gym) => gym.status === "active")
                          .map((gym) => {
                            const displayName = gym.name_th || gym.name_en || "ไม่ระบุชื่อ"
                            return (
                              <SelectItem key={gym.id} value={gym.id}>
                                {displayName}
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Private Classes - Only for Freelancers */}
            {formData.isFreelancer && (
              <PrivateClassManager
                privateClasses={formData.privateClasses}
                onClassesChange={(privateClasses) => setFormData({ ...formData, privateClasses })}
                disabled={isSubmitting}
              />
            )}

            {/* SEO Tags */}
            <CollapsibleTagSelector
              selectedTags={formData.tags}
              onTagsChange={(tags) => setFormData({ ...formData, tags })}
              disabled={isSubmitting}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-2 pb-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "กำลังบันทึก..." : trainer ? "อัปเดต" : "สร้าง"} ครูมวย
              </Button>
            </div>
          </form>
        </div>
      </ScrollArea>
    </div>
  )
}
