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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, ChevronsUpDown, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Gym, Province } from "@/lib/types"
import { PrivateClassManager } from "@/components/private-class-manager"
import { CollapsibleTagSelector } from "@/components/collapsible-tag-selector"
import { 
  validateFormData, 
  formatPhoneInput, 
  cleanPhoneForAPI,
  validateEmail 
} from "@/lib/utils/form-helpers"

// Helper function to transform backend classes to frontend format
function transformBackendClassesToPrivateClasses(backendClasses: any[]): any[] {
  if (!backendClasses || !Array.isArray(backendClasses)) {
    return []
  }

  return backendClasses
    .filter(cls => cls.is_private_class) // Only include private classes for the form
    .map(cls => ({
      id: cls.id || `temp-${Date.now()}-${Math.random()}`,
      name: {
        th: cls.name_th || "",
        en: cls.name_en || "",
      },
      description: {
        th: cls.description_th || "",
        en: cls.description_en || "",
      },
      duration: cls.duration_minutes || 60,
      price: cls.price ? Math.round(cls.price / 100) : 1000, // Convert from satang to baht
      currency: "THB",
      maxStudents: cls.max_students || 1,
      isActive: cls.is_active !== false,
      createdDate: cls.created_at ? new Date(cls.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }))
}

export interface TrainerFormData {
  id?: string
  firstName: { th: string; en: string }
  lastName: { th: string; en: string }
  email: string
  phone: string
  status: "active" | "inactive"
  assignedGym: string
  province_id: number | null
  tags: string[]
  isFreelancer: boolean
  bio: { th: string; en: string }
  lineId: string
  yearsOfExperience: number
  privateClasses: any[]
  joinedDate?: string
}

export interface TrainerFormProps {
  trainer?: TrainerFormData | any // Allow both form data and backend data structure
  gyms?: Gym[]
  provinces?: Province[]
  onSubmit: (trainer: TrainerFormData) => void
  onCancel: () => void
}

export function TrainerForm({ trainer, gyms = [], provinces = [], onSubmit, onCancel }: TrainerFormProps) {
  const [formData, setFormData] = useState<TrainerFormData>({
    firstName: {
      th: trainer?.firstName?.th || trainer?.first_name_th || "",
      en: trainer?.firstName?.en || trainer?.first_name_en || "",
    },
    lastName: {
      th: trainer?.lastName?.th || trainer?.last_name_th || "",
      en: trainer?.lastName?.en || trainer?.last_name_en || "",
    },
    email: trainer?.email || "",
    phone: trainer?.phone || "",
    status: trainer?.status || (trainer?.is_active !== undefined ? (trainer.is_active ? "active" : "inactive") : "active"),
    assignedGym: trainer?.assignedGym || trainer?.primaryGym?.id || trainer?.gym_id || "",
    province_id: trainer?.province_id || trainer?.province?.id || null,
    tags: trainer?.tags || [],
    isFreelancer: trainer?.isFreelancer !== undefined ? trainer.isFreelancer : (trainer?.is_freelance || false),
    bio: {
      th: trainer?.bio?.th || trainer?.bio_th || "",
      en: trainer?.bio?.en || trainer?.bio_en || "",
    },
    lineId: trainer?.lineId || trainer?.line_id || "",
    yearsOfExperience: trainer?.yearsOfExperience || trainer?.exp_year || 0,
    privateClasses: trainer?.privateClasses || transformBackendClassesToPrivateClasses(trainer?.classes || []),
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGymPopoverOpen, setIsGymPopoverOpen] = useState(false)
  const [isProvincePopoverOpen, setIsProvincePopoverOpen] = useState(false)

  const validateForm = () => {
    const requiredFields = [
      'firstName.th', 'lastName.th', 'firstName.en', 'lastName.en',
      'phone', 'bio.th', 'bio.en'
    ]
    
    // Create a flat version of formData for validation
    const flatFormData = {
      'firstName.th': formData.firstName.th,
      'lastName.th': formData.lastName.th,
      'firstName.en': formData.firstName.en,
      'lastName.en': formData.lastName.en,
      'phone': formData.phone,
      'bio.th': formData.bio.th,
      'bio.en': formData.bio.en,
      'email': formData.email,
      'yearsOfExperience': formData.yearsOfExperience,
      'assignedGym': formData.assignedGym,
      'province_id': formData.province_id,
      'isFreelancer': formData.isFreelancer
    }

    const formErrors = validateFormData(flatFormData, requiredFields)

    // Add custom validation
    if (formData.email && !validateEmail(formData.email)) {
      formErrors.email = "กรุณาใส่อีเมลที่ถูกต้อง"
    }

    if (formData.yearsOfExperience < 0 || formData.yearsOfExperience > 99) {
      formErrors.yearsOfExperience = "ประสบการณ์ต้องอยู่ระหว่าง 0 ถึง 99 ปี"
    }

    if (!formData.isFreelancer && !formData.assignedGym) {
      formErrors.assignedGym = "ครูมวยที่ไม่ใช่ฟรีแลนซ์ต้องมีการมอบหมายยิม"
    }

    if (!formData.province_id) {
      formErrors.province_id = "กรุณาเลือกจังหวัด"
    }

    setErrors(formErrors)
    return Object.keys(formErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Clean phone number before submission
      const cleanedFormData = {
        ...formData,
        phone: cleanPhoneForAPI(formData.phone)
      }
      await onSubmit(cleanedFormData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value)
    setFormData({ ...formData, phone: formatted })
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
                      className={`h-9 ${errors['firstName.th'] ? "border-red-500" : ""}`}
                    />
                    {errors['firstName.th'] && <p className="text-sm text-red-500 mt-1">{errors['firstName.th']}</p>}
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
                      className={`h-9 ${errors['lastName.th'] ? "border-red-500" : ""}`}
                    />
                    {errors['lastName.th'] && <p className="text-sm text-red-500 mt-1">{errors['lastName.th']}</p>}
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
                    placeholder="บอกเราเกี่ยวกับประวัติ ความเชี่ยวชาญ และปรัชญาการฝึกของคุณ..."
                    rows={3}
                    disabled={isSubmitting}
                    className={`resize-none ${errors['bio.th'] ? "border-red-500" : ""}`}
                  />
                  {errors['bio.th'] && <p className="text-sm text-red-500 mt-1">{errors['bio.th']}</p>}
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
                      placeholder="First name in English"
                      disabled={isSubmitting}
                      className={`h-9 ${errors['firstName.en'] ? "border-red-500" : ""}`}
                    />
                    {errors['firstName.en'] && <p className="text-sm text-red-500 mt-1">{errors['firstName.en']}</p>}
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
                      placeholder="Last name in English"
                      disabled={isSubmitting}
                      className={`h-9 ${errors['lastName.en'] ? "border-red-500" : ""}`}
                    />
                    {errors['lastName.en'] && <p className="text-sm text-red-500 mt-1">{errors['lastName.en']}</p>}
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
                    placeholder="Tell us about your background, expertise, and training philosophy..."
                    rows={3}
                    disabled={isSubmitting}
                    className={`resize-none ${errors['bio.en'] ? "border-red-500" : ""}`}
                  />
                  {errors['bio.en'] && <p className="text-sm text-red-500 mt-1">{errors['bio.en']}</p>}
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
                      onChange={handlePhoneChange}
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
                      placeholder="0-99"
                      disabled={isSubmitting}
                      className={`h-9 ${errors.yearsOfExperience ? "border-red-500" : ""}`}
                    />
                    {errors.yearsOfExperience && <p className="text-sm text-red-500 mt-1">{errors.yearsOfExperience}</p>}
                  </div>
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
                      const newFormData = { ...formData, isFreelancer: checked }
                      if (checked) {
                        // When switching to freelancer, clear assigned gym.
                        newFormData.assignedGym = ""
                      }
                      setFormData(newFormData)
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
                              if (formData.assignedGym) {
                                const selectedGym = gyms.find((gym) => gym.id === formData.assignedGym)
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
                                          setFormData({ ...formData, assignedGym: gym.id })
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
                
                <div className="space-y-1">
                  <Label htmlFor="province" className="text-sm">
                    จังหวัด *
                  </Label>
                  <Popover open={isProvincePopoverOpen} onOpenChange={setIsProvincePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isProvincePopoverOpen}
                        className={cn(
                          "h-9 w-full justify-between text-left",
                          !formData.province_id && "text-muted-foreground",
                          errors.province_id && "border-red-500"
                        )}
                        disabled={isSubmitting}
                      >
                        <span className="truncate">
                          {formData.province_id
                            ? provinces?.find(p => p.id === formData.province_id)?.name_th
                            : "เลือกจังหวัด"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="ค้นหาจังหวัด..."
                          className="h-9"
                        />
                        <CommandEmpty>ไม่พบจังหวัดที่ค้นหา</CommandEmpty>
                        <CommandList>
                           <div className="max-h-[200px] overflow-y-auto">
                            <CommandGroup>
                              {provinces?.map((province) => (
                                <CommandItem
                                  key={province.id}
                                  value={province.name_th}
                                  onSelect={() => {
                                    setFormData({ ...formData, province_id: province.id })
                                    setIsProvincePopoverOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.province_id === province.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {province.name_th}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </div>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.province_id && <p className="text-sm text-red-500 mt-1">{errors.province_id}</p>}
                </div>
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

            {/* Account Status Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                  สถานะบัญชี
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <AlertDescription>
                    <span className="text-red-500"><strong>คำเตือน: </strong>การปิดใช้งานบัญชีจะทำให้ครูมวยนี้ไม่ปรากฏในระบบสำหรับผู้ใช้ทั่วไป</span>
                  </AlertDescription>
                </Alert>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="status"
                    checked={formData.status === "active"}
                    onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? "active" : "inactive" })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="status" className="text-sm font-medium">
                    เปิดใช้งานบัญชี
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-2 pb-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "กำลังบันทึก..." : trainer ? "อัพเดท" : "สร้าง"}
              </Button>
            </div>
          </form>
        </div>
      </ScrollArea>
    </div>
  )
}
