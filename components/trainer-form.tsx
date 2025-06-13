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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Gym } from "@/lib/types"
import { PrivateClassManager } from "@/components/private-class-manager"
import { CollapsibleTagSelector } from "@/components/collapsible-tag-selector"

export interface TrainerFormData {
  id?: string
  firstName: { th: string; en: string }
  lastName: { th: string; en: string }
  email: string
  phone: string
  status: "active" | "inactive"
  assignedGym: string
  tags: string[]
  isFreelancer: boolean
  bio: { th: string; en: string }
  lineId: string
  yearsOfExperience: number
  privateClasses: any[]
  joinedDate?: string
}

export interface TrainerFormProps {
  trainer?: TrainerFormData
  gyms?: Gym[]
  onSubmit: (trainer: TrainerFormData) => void
  onCancel: () => void
}

export function TrainerForm({ trainer, gyms = [], onSubmit, onCancel }: TrainerFormProps) {
  const [formData, setFormData] = useState<TrainerFormData>({
    firstName: {
      th: trainer?.firstName?.th || "",
      en: trainer?.firstName?.en || "",
    },
    lastName: {
      th: trainer?.lastName?.th || "",
      en: trainer?.lastName?.en || "",
    },
    email: trainer?.email || "",
    phone: trainer?.phone || "",
    status: trainer?.status || "active",
    assignedGym: trainer?.assignedGym || "",
    tags: trainer?.tags || [],
    isFreelancer: trainer?.isFreelancer || false,
    bio: {
      th: trainer?.bio?.th || "",
      en: trainer?.bio?.en || "",
    },
    lineId: trainer?.lineId || "",
    yearsOfExperience: trainer?.yearsOfExperience || 0,
    privateClasses: trainer?.privateClasses || [],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGymPopoverOpen, setIsGymPopoverOpen] = useState(false)

  const validateForm = () => {
    console.log("=== validateForm called ===")
    console.log("Form data:", formData)
    console.log("isFreelancer:", formData.isFreelancer)
    console.log("assignedGym:", formData.assignedGym)
    console.log("assignedGym type:", typeof formData.assignedGym)
    console.log("assignedGym length:", formData.assignedGym?.length)
    
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.th.trim()) {
      newErrors.firstNameTh = "จำเป็นต้องระบุชื่อภาษาไทย"
    }

    if (!formData.lastName.th.trim()) {
      newErrors.lastNameTh = "จำเป็นต้องระบุนามสกุลภาษาไทย"
    }

    if (!formData.firstName.en.trim()) {
      newErrors.firstNameEn = "First name in English is required"
    }

    if (!formData.lastName.en.trim()) {
      newErrors.lastNameEn = "Last name in English is required"
    }

    if (!formData.bio.th.trim()) {
      newErrors.bioTh = "จำเป็นต้องระบุประวัติภาษาไทย"
    }

    if (!formData.bio.en.trim()) {
      newErrors.bioEn = "Description in English is required"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "จำเป็นต้องระบุเบอร์โทร"
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "กรุณาใส่อีเมลที่ถูกต้อง"
    }

    if (formData.yearsOfExperience < 0 || formData.yearsOfExperience > 99) {
      newErrors.yearsOfExperience = "ประสบการณ์ต้องอยู่ระหว่าง 0 ถึง 99 ปี"
    }

    if (!formData.isFreelancer && !formData.assignedGym) {
      newErrors.assignedGym = "ครูมวยที่ไม่ใช่ฟรีแลนซ์ต้องมีการมอบหมายยิม"
    }

    console.log("Validation errors:", newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateField = (fieldName: string, value: any, currentFormData?: any) => {
    const newErrors = { ...errors }
    const currentData = currentFormData || formData

    switch (fieldName) {
      case 'firstNameTh':
        if (!value.trim()) {
          newErrors.firstNameTh = "จำเป็นต้องระบุชื่อภาษาไทย"
        } else {
          delete newErrors.firstNameTh
        }
        break
      case 'lastNameTh':
        if (!value.trim()) {
          newErrors.lastNameTh = "จำเป็นต้องระบุนามสกุลภาษาไทย"
        } else {
          delete newErrors.lastNameTh
        }
        break
      case 'firstNameEn':
        if (!value.trim()) {
          newErrors.firstNameEn = "First name in English is required"
        } else {
          delete newErrors.firstNameEn
        }
        break
      case 'lastNameEn':
        if (!value.trim()) {
          newErrors.lastNameEn = "Last name in English is required"
        } else {
          delete newErrors.lastNameEn
        }
        break
      case 'bioTh':
        if (!value.trim()) {
          newErrors.bioTh = "จำเป็นต้องระบุประวัติภาษาไทย"
        } else {
          delete newErrors.bioTh
        }
        break
      case 'bioEn':
        if (!value.trim()) {
          newErrors.bioEn = "Description in English is required"
        } else {
          delete newErrors.bioEn
        }
        break
      case 'phone':
        if (!value.trim()) {
          newErrors.phone = "จำเป็นต้องระบุเบอร์โทร"
        } else {
          delete newErrors.phone
        }
        break
      case 'email':
        if (value.trim() && !/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = "กรุณาใส่อีเมลที่ถูกต้อง"
        } else {
          delete newErrors.email
        }
        break
      case 'yearsOfExperience':
        const numValue = Number(value) || 0
        if (numValue < 0 || numValue > 60) {
          newErrors.yearsOfExperience = "ประสบการณ์ต้องอยู่ระหว่าง 0 ถึง 60 ปี"
        } else {
          delete newErrors.yearsOfExperience
        }
        break
      case 'assignedGym':
        if (!currentData.isFreelancer && !value) {
          newErrors.assignedGym = "ครูมวยที่ไม่ใช่ฟรีแลนซ์ต้องมีการมอบหมายยิม"
        } else {
          delete newErrors.assignedGym
        }
        break
    }

    setErrors(newErrors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(formData)
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
                      onBlur={(e) => validateField('firstNameTh', e.target.value)}
                      placeholder="ชื่อภาษาไทย"
                      disabled={isSubmitting}
                      className={`h-9 ${errors.firstNameTh ? "border-red-500" : ""}`}
                    />
                    {errors.firstNameTh && <p className="text-sm text-red-500 mt-1">{errors.firstNameTh}</p>}
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
                      onBlur={(e) => validateField('lastNameTh', e.target.value)}
                      placeholder="นามสกุลภาษาไทย"
                      disabled={isSubmitting}
                      className={`h-9 ${errors.lastNameTh ? "border-red-500" : ""}`}
                    />
                    {errors.lastNameTh && <p className="text-sm text-red-500 mt-1">{errors.lastNameTh}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bioTh" className="text-sm">
                    ประวัติ / คำอธิบาย (TH) *
                  </Label>
                  <Textarea
                    id="bioTh"
                    value={formData.bio.th}
                    onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, th: e.target.value } })}
                    onBlur={(e) => validateField('bioTh', e.target.value)}
                    placeholder="บอกเราเกี่ยวกับประวัติ ความเชี่ยวชาญ และปรัชญาการฝึกของคุณ..."
                    rows={3}
                    disabled={isSubmitting}
                    className={`resize-none ${errors.bioTh ? "border-red-500" : ""}`}
                  />
                  {errors.bioTh && <p className="text-sm text-red-500 mt-1">{errors.bioTh}</p>}
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
                      First Name (EN) *
                    </Label>
                    <Input
                      id="firstNameEn"
                      value={formData.firstName.en}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: { ...formData.firstName, en: e.target.value } })
                      }
                      onBlur={(e) => validateField('firstNameEn', e.target.value)}
                      placeholder="First name in English"
                      disabled={isSubmitting}
                      className={`h-9 ${errors.firstNameEn ? "border-red-500" : ""}`}
                    />
                    {errors.firstNameEn && <p className="text-sm text-red-500 mt-1">{errors.firstNameEn}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lastNameEn" className="text-sm">
                      Last Name (EN) *
                    </Label>
                    <Input
                      id="lastNameEn"
                      value={formData.lastName.en}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: { ...formData.lastName, en: e.target.value } })
                      }
                      onBlur={(e) => validateField('lastNameEn', e.target.value)}
                      placeholder="Last name in English"
                      disabled={isSubmitting}
                      className={`h-9 ${errors.lastNameEn ? "border-red-500" : ""}`}
                    />
                    {errors.lastNameEn && <p className="text-sm text-red-500 mt-1">{errors.lastNameEn}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bioEn" className="text-sm">
                    Description (EN) *
                  </Label>
                  <Textarea
                    id="bioEn"
                    value={formData.bio.en}
                    onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, en: e.target.value } })}
                    onBlur={(e) => validateField('bioEn', e.target.value)}
                    placeholder="Tell us about your background, expertise, and training philosophy..."
                    rows={3}
                    disabled={isSubmitting}
                    className={`resize-none ${errors.bioEn ? "border-red-500" : ""}`}
                  />
                  {errors.bioEn && <p className="text-sm text-red-500 mt-1">{errors.bioEn}</p>}
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
                      อีเมล
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onBlur={(e) => validateField('email', e.target.value)}
                      disabled={isSubmitting}
                      className={`h-9 ${errors.email ? "border-red-500" : ""}`}
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-sm">
                      เบอร์โทร *
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onBlur={(e) => validateField('phone', e.target.value)}
                      disabled={isSubmitting}
                      className={`h-9 ${errors.phone ? "border-red-500" : ""}`}
                    />
                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="lineId" className="text-sm">
                      Line ID
                    </Label>
                    <Input
                      id="lineId"
                      value={formData.lineId}
                      onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                      placeholder="@lineid or lineid"
                      disabled={isSubmitting}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="experience" className="text-sm">
                      ปีของประสบการณ์ *
                    </Label>
                    <Input
                      id="experience"
                      type="text"
                      value={formData.yearsOfExperience}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || (/^\d+$/.test(value) && Number(value) <= 99)) {
                          setFormData({ ...formData, yearsOfExperience: Number(value) || 0 })
                        }
                      }}
                      onBlur={(e) => validateField('yearsOfExperience', e.target.value)}
                      placeholder="0-60"
                      disabled={isSubmitting}
                      className={`h-9 ${errors.yearsOfExperience ? "border-red-500" : ""}`}
                    />
                    {errors.yearsOfExperience && <p className="text-sm text-red-500 mt-1">{errors.yearsOfExperience}</p>}
                  </div>
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
                    onCheckedChange={(checked) => {
                      const updatedFormData = { ...formData, isFreelancer: checked }
                      setFormData(updatedFormData)
                      // Clear gym assignment error when switching to freelancer
                      if (checked) {
                        const newErrors = { ...errors }
                        delete newErrors.assignedGym
                        setErrors(newErrors)
                      } else {
                        // Validate gym assignment when switching to staff
                        validateField('assignedGym', formData.assignedGym, updatedFormData)
                      }
                    }}
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
                      ยิมที่มอบหมาย *
                    </Label>
                    {/* Overlay to dim the screen when popover is open */}
                    {isGymPopoverOpen && (
                      <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsGymPopoverOpen(false)} />
                    )}
                    <Popover open={isGymPopoverOpen} onOpenChange={setIsGymPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isGymPopoverOpen}
                          className={cn(
                            "h-9 w-full justify-between text-left relative z-50",
                            !formData.assignedGym && "text-muted-foreground",
                            errors.assignedGym && "border-red-500"
                          )}
                          disabled={isSubmitting}
                        >
                          <span className="truncate">
                            {(() => {
                              console.log("Rendering gym selector - assignedGym:", formData.assignedGym)
                              if (formData.assignedGym) {
                                const selectedGym = gyms.find((gym) => gym.id === formData.assignedGym)
                                console.log("Found selected gym:", selectedGym)
                                return selectedGym?.name_th || selectedGym?.name_en || "เลือกยิม"
                              }
                              return "เลือกยิม"
                            })()}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 z-50" align="start">
                        <Command>
                          <CommandInput
                            placeholder="ค้นหายิม..."
                            className="h-9"
                          />
                          <CommandEmpty>ไม่พบยิมที่ค้นหา</CommandEmpty>
                          <CommandList>
                            <div 
                              className="max-h-[200px] overflow-y-auto"
                              style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#d1d5db #f3f4f6'
                              }}
                              onWheel={(e) => {
                                e.stopPropagation();
                                const target = e.currentTarget;
                                target.scrollTop += e.deltaY;
                              }}
                            >
                              <CommandGroup>
                                {gyms
                                  .filter((gym) => gym.is_active)
                                  .map((gym) => {
                                    const displayName = gym.name_th || gym.name_en || "ไม่ระบุชื่อ"
                                    return (
                                      <CommandItem
                                        key={gym.id}
                                        value={displayName}
                                        onSelect={() => {
                                          console.log("Selecting gym:", gym.id, displayName)
                                          const updatedFormData = { ...formData, assignedGym: gym.id }
                                          setFormData(updatedFormData)
                                          validateField('assignedGym', gym.id, updatedFormData)
                                          setIsGymPopoverOpen(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            formData.assignedGym === gym.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {displayName}
                                      </CommandItem>
                                    )
                                  })}
                              </CommandGroup>
                            </div>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.assignedGym && <p className="text-sm text-red-500 mt-1">{errors.assignedGym}</p>}
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
