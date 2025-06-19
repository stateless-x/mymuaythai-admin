"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { X, Search, ChevronDown, ChevronRight, Tag as TagIcon, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Tag } from "@/lib/types"
import { tagsApi } from "@/lib/api"
import { useDebounce } from "@/hooks/use-debounce"

interface CollapsibleTagSelectorProps {
  selectedTags: string[] // Array of tag slugs
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
  maxTags?: number
}

export function CollapsibleTagSelector({ 
  selectedTags, 
  onTagsChange, 
  disabled = false,
  maxTags = 5 
}: CollapsibleTagSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTagObjects, setSelectedTagObjects] = useState<Tag[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Load available tags when search term changes
  useEffect(() => {
    const loadTags = async () => {
      if (!isOpen) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await tagsApi.getAll({ 
          searchTerm: debouncedSearchTerm || undefined, 
          pageSize: 50 
        })
        const tags = response.data?.items || response.data || response
        setAvailableTags(tags)
      } catch (err) {
        console.error('Failed to load tags:', err)
        setError('ไม่สามารถโหลดแท็กได้')
      } finally {
        setIsLoading(false)
      }
    }

    loadTags()
  }, [debouncedSearchTerm, isOpen])

  // Load selected tag details when selectedTags changes
  useEffect(() => {
    const loadSelectedTags = async () => {
      if (selectedTags.length === 0) {
        setSelectedTagObjects([])
        return
      }

      try {
        // Try to find selected tags in available tags first
        const foundTags = selectedTags.map(slug => 
          availableTags.find(tag => tag.slug === slug)
        ).filter(Boolean) as Tag[]

        // If we have all tags, use them
        if (foundTags.length === selectedTags.length) {
          setSelectedTagObjects(foundTags)
          return
        }

        // Otherwise fetch missing tags individually
        const missingTagPromises = selectedTags
          .filter(slug => !availableTags.find(tag => tag.slug === slug))
          .map(async (slug) => {
            try {
              // We need to search for tags and find the one with matching slug
              const response = await tagsApi.getAll({ searchTerm: slug, pageSize: 10 })
              const tags = response.data?.items || response.data || response
              return tags.find((tag: any) => tag.slug === slug) || null
            } catch (err) {
              console.error(`Failed to load tag with slug: ${slug}`, err)
              return null
            }
          })

        const missingTags = (await Promise.all(missingTagPromises)).filter(Boolean) as Tag[]
        setSelectedTagObjects([...foundTags, ...missingTags])
      } catch (err) {
        console.error('Failed to load selected tags:', err)
      }
    }

    loadSelectedTags()
  }, [selectedTags, availableTags])

  const toggleTag = (tag: Tag) => {
    if (disabled) return

    const isSelected = selectedTags.includes(tag.slug)
    
    if (isSelected) {
      // Remove tag
      onTagsChange(selectedTags.filter(slug => slug !== tag.slug))
    } else {
      // Add tag if under limit
      if (selectedTags.length >= maxTags) {
        return // Don't add if at max limit
      }
      onTagsChange([...selectedTags, tag.slug])
    }
  }

  const removeTag = (slug: string) => {
    if (disabled) return
    onTagsChange(selectedTags.filter(tag => tag !== slug))
  }

  const isMaxTagsReached = selectedTags.length >= maxTags

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TagIcon className="h-5 w-5" />
                <CardTitle className="text-lg">แท็กสำหรับการค้นหา</CardTitle>
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedTags.length}/{maxTags} เลือกแล้ว
                  </Badge>
                )}
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <p className="text-sm text-muted-foreground text-left">
              เลือกแท็กที่เกี่ยวข้องเพื่อปรับปรุงการมองเห็นในการค้นหาและการจัดหมวดหมู่ (สูงสุด {maxTags} แท็ก)
            </p>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Max tags warning */}
            {isMaxTagsReached && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  คุณได้เลือกแท็กครบ {maxTags} แท็กแล้ว กรุณาลบแท็กเก่าก่อนเพิ่มแท็กใหม่
                </AlertDescription>
              </Alert>
            )}

            {/* Selected Tags */}
            {selectedTagObjects.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">แท็กที่เลือก ({selectedTagObjects.length}/{maxTags})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTagObjects.map((tag) => (
                    <Badge
                      key={tag.slug}
                      variant="default"
                      className="text-sm bg-blue-600 hover:bg-blue-700"
                    >
                      {tag.name_th}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeTag(tag.slug)
                          }}
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
              <Label htmlFor="tag-search">ค้นหาแท็ก</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tag-search"
                  placeholder="ค้นหาแท็กภาษาไทยหรือภาษาอังกฤษ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Available Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                แท็กที่มี {isLoading && "(กำลังโหลด...)"}
              </Label>
              
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="text-sm text-muted-foreground">กำลังโหลดแท็ก...</div>
                </div>
              ) : availableTags.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? `ไม่พบแท็กสำหรับ "${searchTerm}"` : "ไม่มีแท็ก"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.slug)
                    const canSelect = !isSelected && !isMaxTagsReached

                    return (
                      <Button
                        key={tag.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleTag(tag)}
                        disabled={disabled || (!isSelected && isMaxTagsReached)}
                        className={`text-xs h-8 ${
                          isSelected 
                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                            : canSelect 
                              ? "hover:bg-blue-50 hover:border-blue-300" 
                              : "opacity-50"
                        }`}
                        title={!canSelect && !isSelected ? "ถึงขีดจำกัดแท็กแล้ว" : undefined}
                      >
                        <div className="flex flex-col items-start leading-tight">
                          <span className="font-medium">{tag.name_th}</span>
                        </div>
                        {isSelected && <X className="ml-1 h-3 w-3" />}
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
