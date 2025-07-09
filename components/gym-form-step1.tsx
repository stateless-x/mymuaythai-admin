"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ExternalLink, Check, ChevronsUpDown, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { Gym, Province } from "@/lib/types"
import { provincesApi } from "@/lib/api"
import { 
  validateUrl, 
  validateFormData,
  formatPhoneInput, 
  cleanFormDataForAPI 
} from "@/lib/utils/form-helpers"

interface GymFormStep1Props {
  gym?: Partial<Gym>
  onNext: (data: Partial<Gym>) => void
  onCancel: () => void
  onSave: (data: Partial<Gym>) => Promise<void>
  isSubmitting?: boolean
}

export function GymFormStep1({ gym, onNext, onCancel, onSave, isSubmitting: isSubmittingProp }: GymFormStep1Props) {
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
    province_id: gym?.province_id || gym?.province?.id || undefined,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [provinces, setProvinces] = useState<Province[]>([])
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
  const [provincesError, setProvincesError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Reset form data when the gym prop changes.
    // This ensures that if the form is reused for a different gym,
    // the fields are correctly populated with the new gym's data.
    setFormData({
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
      province_id: gym?.province_id || gym?.province?.id || undefined,
    })
  }, [gym])

  const fetchProvinces = async () => {
    setIsLoadingProvinces(true)
    setProvincesError(null)
    try {
      const response = await provincesApi.getAll()
      setProvinces(response.data || response)
    } catch (error) {
      console.error("Error fetching provinces:", error)
      setProvincesError("ไม่สามารถโหลดข้อมูลจังหวัดได้")
    } finally {
      setIsLoadingProvinces(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    
    const loadProvinces = async () => {
      setIsLoadingProvinces(true)
      setProvincesError(null)
      try {
        const response = await provincesApi.getAll()
        if (isMounted) {
          setProvinces(response.data || response)
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching provinces:", error)
          setProvincesError("ไม่สามารถโหลดข้อมูลจังหวัดได้")
        }
      } finally {
        if (isMounted) {
          setIsLoadingProvinces(false)
        }
      }
    }
    
    loadProvinces()
    
    return () => {
      isMounted = false
    }
  }, [])

  const validateForm = () => {
    const requiredFields = ['name_th', 'name_en', 'phone', 'description_th', 'description_en', 'province_id']
    const formErrors = validateFormData(formData, requiredFields)
    setErrors(formErrors)
    return Object.keys(formErrors).length === 0
  }

  const handleNext = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const cleanedData = cleanFormDataForAPI(formData)
      await onNext(cleanedData)
    } catch (error) {
      console.error("Error proceeding to next step:", error)
      const { toast } = await import('sonner')
      toast.error("ไม่สามารถดำเนินการต่อได้", {
        description: "กรุณาลองอีกครั้ง"
      })
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
      const cleanedData = cleanFormDataForAPI(formData)
      await onSave(cleanedData)
      const { toast } = await import('sonner')
      toast.success("บันทึกข้อมูลสำเร็จ", {
        description: "ข้อมูลของคุณได้รับการบันทึกแล้ว",
        duration: 1000,
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

  const isEditMode = !!gym?.id
  const isFormDisabled = isSubmitting || isSubmittingProp

  return (
    <form onSubmit={handleNext} noValidate autoComplete="off">
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-md font-medium">
              1
            </div>
            <span className="ml-2 text-md font-medium text-blue-600">ข้อมูลพื้นฐาน</span>
          </div>
          <div className="flex-1 h-px bg-gray-200"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-md font-medium">
              2
            </div>
            <span className="ml-2 text-md text-gray-500">รูปภาพและสิ่งอำนวยความสะดวก</span>
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
                <Label htmlFor="gymNameTh" className="text-md font-medium">
                  ชื่อยิม (ไทย) *
                </Label>
                <Input
                  id="gymNameTh"
                  value={formData.name_th || ""}
                  onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                  placeholder="ชื่อยิมภาษาไทย"
                  disabled={isFormDisabled}
                  autoComplete="off"
                  className={`h-9 ${errors.name_th ? "border-red-500" : ""}`}
                />
                {errors.name_th && <p className="text-md text-red-500 mt-1">{errors.name_th}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gymNameEn" className="text-md font-medium">
                  ชื่อยิม (English) *
                </Label>
                <Input
                  id="gymNameEn"
                  value={formData.name_en || ""}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="Gym name in English"
                  disabled={isFormDisabled}
                  autoComplete="off"
                  className={`h-9 ${errors.name_en ? "border-red-500" : ""}`}
                />
                {errors.name_en && <p className="text-md text-red-500 mt-1">{errors.name_en}</p>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-md font-medium">
                  เบอร์โทรศัพท์ *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })}
                  placeholder="089-123-4567"
                  disabled={isFormDisabled}
                  autoComplete="off"
                  className={`h-9 ${errors.phone ? "border-red-500" : ""}`}
                />
                {errors.phone && <p className="text-md text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-md font-medium">
                  อีเมล
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                  disabled={isFormDisabled}
                  autoComplete="off"
                  className={`h-9 ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && <p className="text-md text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Line ID */}
            <div className="space-y-2">
              <Label htmlFor="lineId" className="text-md font-medium">
                Line ID
              </Label>
              <Input
                id="lineId"
                value={formData.line_id || ""}
                onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                placeholder="gymlineid or @gymlineid"
                disabled={isFormDisabled}
                autoComplete="off"
                className="h-9"
              />
            </div>

            {/* Province Selector */}
            <div className="space-y-2 space-x-3">
              <Label htmlFor="province" className="text-md font-medium">
                จังหวัด *
              </Label>
              {provincesError && (
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{provincesError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchProvinces}
                    disabled={isLoadingProvinces}
                  >
                    ลองใหม่
                  </Button>
                </div>
              )}
              {isOpen && (
                <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />
              )}
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className={cn(
                      "h-9 w-[300px] justify-between text-left relative z-50",
                      !formData.province_id && "text-muted-foreground",
                      errors.province_id && "border-red-500"
                    )}
                    disabled={isFormDisabled || isLoadingProvinces || !!provincesError}
                  >
                    <span className="truncate">
                      {isLoadingProvinces
                        ? "กำลังโหลด..."
                        : provincesError
                        ? "เกิดข้อผิดพลาดในการโหลด"
                        : formData.province_id
                        ? provinces.find(p => p.id === formData.province_id)?.name_th
                        : "เลือกจังหวัด"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 z-50" align="start">
                  <Command>
                    <CommandInput
                      placeholder="ค้นหาจังหวัด..."
                      className="h-9"
                    />
                    <CommandEmpty>ไม่พบจังหวัดที่ค้นหา</CommandEmpty>
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
                          {provinces.map((province) => (
                            <CommandItem
                              key={province.id}
                              value={province.name_th}
                              onSelect={() => {
                                setFormData({ ...formData, province_id: province.id })
                                setIsOpen(false)
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
              {errors.province_id && <p className="text-md text-red-500 mt-1">{errors.province_id}</p>}
            </div>

            {/* Description - Side by side Thai/English */}
            <div className="space-y-2">
              {/* <Label className="text-md font-semibold">เกี่ยวกับยิม</Label> */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionTh" className="text-md text-muted-foreground">
                    คำอธิบาย (ไทย) *
                  </Label>
                  <Textarea
                    id="descriptionTh"
                    value={formData.description_th || ""}
                    onChange={(e) => setFormData({ ...formData, description_th: e.target.value })}
                    placeholder="อธิบายยิม บรรยากาศ และสิ่งที่ทำให้พิเศษ..."
                    disabled={isFormDisabled}
                    autoComplete="off"
                    rows={6}
                    className={`resize-none ${errors.description_th ? "border-red-500" : ""}`}
                  />
                  {errors.description_th && <p className="text-md text-red-500 mt-1">{errors.description_th}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn" className="text-md text-muted-foreground">
                    คำอธิบาย (English) *
                  </Label>
                  <Textarea
                    id="descriptionEn"
                    value={formData.description_en || ""}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Describe the gym, atmosphere, and what makes it special..."
                    disabled={isFormDisabled}
                    autoComplete="off"
                    rows={6}
                    className={`resize-none ${errors.description_en ? "border-red-500" : ""}`}
                  />
                  {errors.description_en && <p className="text-md text-red-500 mt-1">{errors.description_en}</p>}
                </div>
              </div>
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
              <Label htmlFor="mapUrl" className="text-md">
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
                  disabled={isFormDisabled}
                  autoComplete="off"
                />
                {formData.map_url && validateUrl(formData.map_url) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formData.map_url, "_blank")}
                    disabled={isFormDisabled}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.map_url && <p className="text-md text-red-500 mt-1">{errors.map_url}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="youtubeUrl" className="text-md">
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
                  disabled={isFormDisabled}
                  autoComplete="off"
                />
                {formData.youtube_url && validateUrl(formData.youtube_url) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formData.youtube_url, "_blank")}
                    disabled={isFormDisabled}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.youtube_url && <p className="text-md text-red-500 mt-1">{errors.youtube_url}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
              สถานะการแสดงผลของยิม
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertDescription>
                <span className="text-red-500"><strong>คำเตือน: </strong>การปิดใช้งานจะทำให้ยิมนี้ไม่ปรากฏในระบบสำหรับผู้ใช้ทั่วไป</span>
              </AlertDescription>
            </Alert>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="status"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                disabled={isFormDisabled}
              />
              <Label htmlFor="status" className="text-sm font-medium">
                เปิดใช้งานยิม
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isFormDisabled}>
            ยกเลิก
          </Button>
          <div className="flex gap-2">
            {/* Show save button only in edit mode */}
            {isEditMode && (
              <Button 
                type="button" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSave} 
                disabled={isFormDisabled}
              >
                {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            )}
            <Button type="submit" disabled={isFormDisabled}>
              {isSubmitting || isSubmittingProp ? "กำลังดำเนินการ..." : "ถัดไป"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
