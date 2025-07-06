"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, ChevronsUpDown, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Trainer, Province, Tag } from "@/lib/types"
import { ClassManager } from "@/components/class-manager"
import { CollapsibleTagSelector } from "@/components/collapsible-tag-selector"
import { ImageUpload } from "@/components/image-upload"
import { tagsApi, provincesApi } from "@/lib/api"
import { trimFormData } from "@/lib/utils/form-helpers"

interface TrainerFormStep2Props {
  trainer?: Partial<Trainer>
  initialData: Partial<Trainer>
  provinces?: Province[]
  onSubmit: (data: Partial<Trainer>) => void
  onBack: () => void
  onSave: (data: Partial<Trainer>) => Promise<void>
  onCancel: () => void
  onSuccess?: () => void
}

function transformBackendClassesToClasses(backendClasses: any[]): any[] {
    console.log("backendClasses", backendClasses);
  if (!backendClasses || !Array.isArray(backendClasses)) return []
  return backendClasses
    .map(cls => ({
      id: cls.id || `temp-${Date.now()}-${Math.random()}`,
      name: { th: cls.name_th || "", en: cls.name_en || "" },
      description: { th: cls.description_th || "", en: cls.description_en || "" },
      duration: cls.duration_minutes || 60,
      price: cls.price ? Math.round(cls.price / 100) : 1000,
      currency: "THB",
      maxStudents: cls.max_students || 1,
      isActive: cls.is_active !== false,
      isPrivate: cls.is_private_class,
      createdDate: cls.created_at ? new Date(cls.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }))
}

function transformClassesToBackend(classes: any[]): any[] {
  if (!classes || !Array.isArray(classes)) return []
  return classes.map(cls => ({
    name_th: cls.name.th,
    name_en: cls.name.en,
    description_th: cls.description.th,
    description_en: cls.description.en,
    duration_minutes: cls.duration,
    price: Math.round(cls.price * 100),
    max_students: cls.maxStudents,
    is_active: cls.isActive,
    is_private_class: cls.isPrivate
  }))
}

const getTagSlugs = (tags: any[]): string[] => {
  if (!tags || !Array.isArray(tags)) return []
  return tags.map((tag: any) => (typeof tag === 'object' && tag.slug) ? tag.slug : typeof tag === 'string' ? tag : '').filter(slug => slug !== '')
}

const convertTagSlugsToTagObjects = async (tagSlugs: string[]): Promise<Tag[]> => {
    if (!tagSlugs || tagSlugs.length === 0) return []
    try {
        const tagPromises = tagSlugs.map(async (slug) => {
            try {
                const response = await tagsApi.getAll({ searchTerm: slug, pageSize: 10 })
                const tags = response.data?.items || response.data || response
                return tags.find((tag: any) => tag.slug === slug) || null
            } catch (err) {
                console.error(`Failed to get tag with slug: ${slug}`, err)
                return null
            }
        })
        const tags = await Promise.all(tagPromises)
        return tags.filter((tag): tag is Tag => tag !== null)
    } catch (error) {
        console.error('Error converting tag slugs to objects:', error)
        return []
    }
}

export function TrainerFormStep2({ trainer, initialData, onSubmit, onBack, onCancel, onSuccess }: TrainerFormStep2Props) {
  const [formData, setFormData] = useState({
    ...initialData,
    province_id: trainer?.province_id || trainer?.province?.id || null,
    is_freelance: trainer?.is_freelance || false,
    is_active: trainer?.is_active !== undefined ? trainer.is_active : true,
    tags: getTagSlugs(trainer?.tags || []),
    images: trainer?.images || [],
    classes: trainer?.classes ? transformBackendClassesToClasses(trainer.classes) : [],
  })
  
  const [provinces, setProvinces] = useState<Province[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isProvincePopoverOpen, setIsProvincePopoverOpen] = useState(false)

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await provincesApi.getAll()
        setProvinces(response.data || response)
      } catch (error) {
        console.error("Failed to fetch provinces", error)
      }
    }
    fetchProvinces()
  }, [])

  useEffect(() => {
    setFormData({
      ...initialData,
      province_id: trainer?.province_id || trainer?.province?.id || null,
      is_freelance: trainer?.is_freelance || false,
      is_active: trainer?.is_active !== undefined ? trainer.is_active : true,
      tags: getTagSlugs(trainer?.tags || []),
      images: trainer?.images || [],
      classes: trainer?.classes ? transformBackendClassesToClasses(trainer.classes) : [],
    })
  }, [trainer, initialData])

  const validateForm = () => {
    const formErrors: Record<string, string> = {}
    if (!formData.province_id) {
      formErrors.province_id = "กรุณาเลือกจังหวัด"
    }
    setErrors(formErrors)
    return Object.keys(formErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const tagObjects = await convertTagSlugsToTagObjects(formData.tags || [])
      const backendClasses = transformClassesToBackend(formData.classes)

      const backendFormData = {
        ...initialData,
        ...formData,
        tags: tagObjects,
        classes: backendClasses,
      }
      
      const completeFormData = trimFormData(backendFormData)
      await onSubmit(completeFormData as any)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error submitting form:", error)
      const { toast } = await import("sonner")
      toast.error("ไม่สามารถบันทึกข้อมูลได้", { description: "กรุณาลองอีกครั้ง" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div>
          <span className="ml-2 text-sm font-medium text-green-600">ข้อมูลพื้นฐาน</span>
        </div>
        <div className="flex-1 h-px bg-blue-600"></div>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
          <span className="ml-2 text-sm font-medium text-blue-600">ข้อมูลเพิ่มเติม</span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">ข้อมูลการจ้างงาน</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch id="freelancer" checked={formData.is_freelance} onCheckedChange={(checked) => setFormData({ ...formData, is_freelance: checked })} disabled={isSubmitting} />
            <Label htmlFor="freelancer" className="text-sm">ฟรีแลนซ์</Label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="province" className="text-sm">จังหวัด *</Label>
            <Popover open={isProvincePopoverOpen} onOpenChange={setIsProvincePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className={cn("h-9 w-full justify-between text-left", !formData.province_id && "text-muted-foreground", errors.province_id && "border-red-500")} disabled={isSubmitting}>
                  <span className="truncate">{formData.province_id ? provinces?.find(p => p.id === formData.province_id)?.name_th : "เลือกจังหวัด"}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="ค้นหาจังหวัด..." className="h-9" />
                  <CommandEmpty>ไม่พบจังหวัด</CommandEmpty>
                  <CommandList><CommandGroup>{provinces?.map((province) => (<CommandItem key={province.id} value={province.name_th} onSelect={() => { setFormData({ ...formData, province_id: province.id }); setIsProvincePopoverOpen(false) }}><Check className={cn("mr-2 h-4 w-4", formData.province_id === province.id ? "opacity-100" : "opacity-0")} />{province.name_th}</CommandItem>))}</CommandGroup></CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.province_id && <p className="text-sm text-red-500 mt-1">{errors.province_id}</p>}
          </div>
        </CardContent>
      </Card>

      {formData.is_freelance && (
        <ClassManager classes={formData.classes} onClassesChange={(classes) => setFormData({ ...formData, classes })} disabled={isSubmitting} />
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">รูปภาพครูมวย</CardTitle><p className="text-sm text-muted-foreground">อัปโหลดรูปภาพครูมวยได้สูงสุด 5 รูป</p></CardHeader>
        <CardContent>
          <ImageUpload images={formData.images || []} onImagesChange={(newImages) => setFormData({ ...formData, images: newImages })} maxImages={5} disabled={isSubmitting} uploadUrl={trainer?.id ? `/api/trainers/${trainer.id}/images` : undefined} />
        </CardContent>
      </Card>

      <CollapsibleTagSelector selectedTags={formData.tags} onTagsChange={(tags) => setFormData({ ...formData, tags })} disabled={isSubmitting} />

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center"><AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />สถานะบัญชี</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Alert><AlertDescription><span className="text-red-500"><strong>คำเตือน: </strong>การปิดใช้งานจะทำให้ครูมวยนี้ไม่ปรากฏในระบบ</span></AlertDescription></Alert>
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="status" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} disabled={isSubmitting} />
            <Label htmlFor="status" className="text-sm font-medium">เปิดใช้งานบัญชี</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>ย้อนกลับ</Button>
        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "กำลังบันทึก..." : trainer?.id ? "บันทึก" : "สร้างครูมวย"}
          </Button>
        </div>
      </div>
    </div>
  )
} 