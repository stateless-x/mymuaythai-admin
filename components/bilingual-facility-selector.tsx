"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { X, Search, Plus } from "lucide-react"

interface BilingualFacilities {
  th: string[]
  en: string[]
}

interface BilingualFacilitySelectorProps {
  value: BilingualFacilities
  onChange: (value: BilingualFacilities) => void
  disabled?: boolean
}

const FACILITY_OPTIONS = [
  { th: "อุปกรณ์ยกน้ำหนัก", en: "Free Weights" },
  { th: "เครื่องออกกำลังกายแบบแอโรบิก", en: "Cardio Equipment" },
  { th: "สระว่ายน้ำ", en: "Swimming Pool" },
  { th: "ซาวน่า", en: "Sauna" },
  { th: "ห้องอบไอน้ำ", en: "Steam Room" },
  { th: "คลาสกลุ่ม", en: "Group Classes" },
  { th: "การฝึกส่วนตัว", en: "Personal Training" },
  { th: "ห้องแต่งตัว", en: "Locker Rooms" },
  { th: "ที่จอดรถ", en: "Parking" },
  { th: "WiFi", en: "WiFi" },
  { th: "เครื่องปรับอากาศ", en: "Air Conditioning" },
  { th: "บาร์น้ำผลไม้", en: "Juice Bar" },
  { th: "บริการผ้าเช็ดตัว", en: "Towel Service" },
  { th: "เปิด 24/7", en: "24/7 Access" },
  { th: "สตูดิโอโยคะ", en: "Yoga Studio" },
  { th: "สตูดิโอพิลาทิส", en: "Pilates Studio" },
  { th: "สนามบาสเกตบอล", en: "Basketball Court" },
  { th: "กำแพงปีนหิน", en: "Rock Climbing Wall" },
  { th: "นวดบำบัด", en: "Massage Therapy" },
  { th: "ดูแลเด็ก", en: "Childcare" },
]

export function BilingualFacilitySelector({ value, onChange, disabled = false }: BilingualFacilitySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [customFacility, setCustomFacility] = useState({ th: "", en: "" })
  const [activeTab, setActiveTab] = useState<"th" | "en">("th")

  const filteredOptions = FACILITY_OPTIONS.filter(
    (option) =>
      option.th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.en.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleFacility = (facility: { th: string; en: string }) => {
    const thExists = value.th?.includes(facility.th)
    const enExists = value.en?.includes(facility.en)

    if (thExists || enExists) {
      // Remove facility
      onChange({
        th: value.th?.filter((f) => f !== facility.th) || [],
        en: value.en?.filter((f) => f !== facility.en) || [],
      })
    } else {
      // Add facility
      onChange({
        th: [...(value.th || []), facility.th],
        en: [...(value.en || []), facility.en],
      })
    }
  }

  const addCustomFacility = () => {
    if (!customFacility.th.trim()) return

    const newFacility = {
      th: customFacility.th.trim(),
      en: customFacility.en.trim() || customFacility.th.trim(),
    }

    onChange({
      th: [...(value.th || []), newFacility.th],
      en: [...(value.en || []), newFacility.en],
    })

    setCustomFacility({ th: "", en: "" })
  }

  const removeFacility = (index: number) => {
    onChange({
      th: value.th?.filter((_, i) => i !== index) || [],
      en: value.en?.filter((_, i) => i !== index) || [],
    })
  }

  const displayFacilities = activeTab === "th" ? value.th || [] : value.en || []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">สิ่งอำนวยความสะดวก</CardTitle>
          <div className="flex space-x-1">
            <Button
              type="button"
              variant={activeTab === "th" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("th")}
              disabled={disabled}
              className="h-7 px-2 text-xs"
            >
              🇹🇭 ไทย
            </Button>
            <Button
              type="button"
              variant={activeTab === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("en")}
              disabled={disabled}
              className="h-7 px-2 text-xs"
            >
              🇺🇸 อังกฤษ
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Facilities */}
        {displayFacilities.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">สิ่งอำนวยความสะดวกที่เลือก ({displayFacilities.length})</Label>
            <div className="flex flex-wrap gap-2">
              {displayFacilities.map((facility, index) => (
                <Badge key={`facility-${index}-${facility}`} variant="default" className="text-sm">
                  {facility}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeFacility(index)}
                      className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="facility-search">ค้นหาสิ่งอำนวยความสะดวก</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="facility-search"
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Add Custom Facility */}
        <div className="space-y-2">
          <Label>เพิ่มสิ่งอำนวยความสะดวกใหม่</Label>
          <div className="flex space-x-2">
            <Input
              placeholder="ชื่อภาษาไทย *"
              value={customFacility.th}
              onChange={(e) => setCustomFacility({ ...customFacility, th: e.target.value })}
              disabled={disabled}
              className="flex-1"
            />
            <Input
              placeholder="English name"
              value={customFacility.en}
              onChange={(e) => setCustomFacility({ ...customFacility, en: e.target.value })}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addCustomFacility}
              disabled={disabled || !customFacility.th.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Predefined Options */}
        <div className="space-y-2">
          <Label>สิ่งอำนวยความสะดวกมาตรฐาน</Label>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {filteredOptions.map((option, index) => {
              const isSelected = value.th?.includes(option.th) || value.en?.includes(option.en)
              const displayText = activeTab === "th" ? option.th : option.en

              return (
                <div key={`option-${index}-${option.th}-${option.en}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`facility-${index}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleFacility(option)}
                    disabled={disabled}
                  />
                  <Label htmlFor={`facility-${index}`} className="text-sm font-normal cursor-pointer flex-1">
                    {displayText}
                  </Label>
                </div>
              )
            })}
          </div>
        </div>

        {filteredOptions.length === 0 && searchTerm && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">ไม่พบสิ่งอำนวยความสะดวกสำหรับ "{searchTerm}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
