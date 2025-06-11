"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { X, Search } from "lucide-react"
import type { Tag } from "@/lib/types"
import { TAG_CATEGORIES } from "@/lib/types"
import { mockTags } from "@/lib/mock-data"

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
}

export function TagSelector({ selectedTags, onTagsChange, disabled = false }: TagSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [availableTags] = useState<Tag[]>(mockTags)

  const filteredTags = availableTags.filter((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const groupedTags = TAG_CATEGORIES.reduce(
    (acc, category) => {
      acc[category.value] = filteredTags.filter((tag) => tag.category === category.value)
      return acc
    },
    {} as Record<string, Tag[]>,
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
      <CardHeader>
        <CardTitle className="text-lg">แท็กสำหรับการค้นหา</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select relevant tags to improve search visibility and categorization
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Tags ({selectedTags.length})</Label>
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
          <Label htmlFor="tag-search">Search Tags</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="tag-search"
              placeholder="Search tags..."
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
                  <span className="text-xs text-muted-foreground">({categoryTags.length} tags)</span>
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
            <p className="text-sm text-muted-foreground">No tags found for "{searchTerm}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
