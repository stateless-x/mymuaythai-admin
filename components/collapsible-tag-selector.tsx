"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { X, Search, ChevronDown, ChevronRight, Tag } from "lucide-react"
import type { Tag as TagType } from "@/lib/types"
import { TAG_CATEGORIES } from "@/lib/types"
import { mockTags } from "@/lib/mock-data"

interface CollapsibleTagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
}

export function CollapsibleTagSelector({ selectedTags, onTagsChange, disabled = false }: CollapsibleTagSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [availableTags] = useState<TagType[]>(mockTags)
  const [isOpen, setIsOpen] = useState(false)

  const filteredTags = availableTags.filter((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const groupedTags = TAG_CATEGORIES.reduce(
    (acc, category) => {
      acc[category.value] = filteredTags.filter((tag) => tag.category === category.value)
      return acc
    },
    {} as Record<string, TagType[]>,
  )

  const toggleTag = (tagName: string) => {
    if (disabled) return

    const updatedTags = selectedTags.includes(tagName)
      ? selectedTags.filter((tag) => tag !== tagName)
      : [...selectedTags, tagName]

    onTagsChange(updatedTags)
  }

  const removeTag = (tagName: string) => {
    if (disabled) return
    onTagsChange(selectedTags.filter((tag) => tag !== tagName))
  }

  const getCategoryInfo = (categoryValue: string) => {
    return TAG_CATEGORIES.find((cat) => cat.value === categoryValue)
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5" />
                <CardTitle className="text-lg">แท็กสำหรับการค้นหา</CardTitle>
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedTags.length} เลือกแล้ว
                  </Badge>
                )}
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <p className="text-sm text-muted-foreground text-left">
              เลือกแท็กที่เกี่ยวข้องเพื่อปรับปรุงการมองเห็นในการค้นหาและการจัดหมวดหมู่
            </p>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">แท็กที่เลือก ({selectedTags.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tagName) => {
                    const tag = availableTags.find((t) => t.name === tagName)
                    const categoryInfo = tag ? getCategoryInfo(tag.category) : null

                    return (
                      <Badge
                        key={tagName}
                        variant="default"
                        className="text-sm"
                        style={{ backgroundColor: tag?.color || "#6b7280" }}
                      >
                        #{tagName}
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => removeTag(tagName)}
                            className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    )
                  })}
                </div>
                <Separator />
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="tag-search">ค้นหาแท็ก</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tag-search"
                  placeholder="ค้นหาแท็ก..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Tag Categories */}
            <div className="space-y-4">
              {TAG_CATEGORIES.map((category) => {
                const categoryTags = groupedTags[category.value] || []

                if (categoryTags.length === 0) return null

                return (
                  <div key={category.value} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <Label className="text-sm font-medium">{category.label}</Label>
                      <span className="text-xs text-muted-foreground">({categoryTags.length} แท็ก)</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {categoryTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.name)

                        return (
                          <Button
                            key={tag.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleTag(tag.name)}
                            disabled={disabled}
                            className="text-xs h-7"
                            style={
                              isSelected
                                ? { backgroundColor: tag.color, borderColor: tag.color }
                                : { borderColor: tag.color, color: tag.color }
                            }
                          >
                            #{tag.name}
                            {isSelected && <X className="ml-1 h-3 w-3" />}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredTags.length === 0 && searchTerm && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">ไม่พบแท็กสำหรับ "{searchTerm}"</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
