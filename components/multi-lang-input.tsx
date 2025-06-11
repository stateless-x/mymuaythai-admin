"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { MultiLangText } from "@/lib/types"

interface MultiLangInputProps {
  label: string
  value: MultiLangText
  onChange: (value: MultiLangText) => void
  placeholder?: { th?: string; en?: string }
  required?: boolean
  disabled?: boolean
  error?: string
  type?: "input" | "textarea"
  rows?: number
}

export function MultiLangInput({
  label,
  value,
  onChange,
  placeholder = {},
  required = false,
  disabled = false,
  error,
  type = "input",
  rows = 3,
}: MultiLangInputProps) {
  const [activeTab, setActiveTab] = useState<"th" | "en">("th")

  const handleChange = (lang: "th" | "en", newValue: string) => {
    onChange({
      ...value,
      [lang]: newValue,
    })
  }

  const InputComponent = type === "textarea" ? Textarea : Input

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className="flex space-x-1">
          <Button
            type="button"
            variant={activeTab === "th" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("th")}
            disabled={disabled}
            className="h-7 px-2 text-xs"
          >
            <span className="mr-1">🇹🇭</span>
            ไทย
            {required && <span className="text-red-500 ml-1">*</span>}
          </Button>
          <Button
            type="button"
            variant={activeTab === "en" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("en")}
            disabled={disabled}
            className="h-7 px-2 text-xs"
          >
            <span className="mr-1">🇺🇸</span>
            EN
          </Button>
        </div>
      </div>

      <Card className={cn("transition-colors", error && "border-red-500")}>
        <CardContent className="p-3">
          {activeTab === "th" ? (
            <InputComponent
              value={value.th || ""}
              onChange={(e) => handleChange("th", e.target.value)}
              placeholder={placeholder.th || `${label} (ภาษาไทย)`}
              disabled={disabled}
              className={cn("border-0 shadow-none focus-visible:ring-0 p-0", error && "text-red-900")}
              rows={type === "textarea" ? rows : undefined}
            />
          ) : (
            <InputComponent
              value={value.en || ""}
              onChange={(e) => handleChange("en", e.target.value)}
              placeholder={placeholder.en || `${label} (English)`}
              disabled={disabled}
              className="border-0 shadow-none focus-visible:ring-0 p-0"
              rows={type === "textarea" ? rows : undefined}
            />
          )}
        </CardContent>
      </Card>

      {/* Language Status Indicators */}
      <div className="flex space-x-2">
        <Badge variant={value.th ? "default" : "secondary"} className="text-xs">
          🇹🇭 {value.th ? "มีข้อมูล" : "ว่าง"}
        </Badge>
        <Badge variant={value.en ? "default" : "secondary"} className="text-xs">
          🇺🇸 {value.en ? "Filled" : "Empty"}
        </Badge>
      </div>

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <span className="text-xs">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}
