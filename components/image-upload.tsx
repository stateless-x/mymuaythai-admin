"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Upload, ImageIcon, Loader2 } from "lucide-react"
import { uploadToBunny } from "@/lib/bunny-upload"

interface ImageUploadProps {
  /**
   * Array of uploaded images. Elements can be either plain CDN url strings (legacy)
   * or objects returned by the backend in the form `{ id: string; image_url: string }`.
   */
  images: (string | { id?: string; image_url: string })[]
  /** Callback when images array should be updated  */
  onImagesChange: (images: (string | { id?: string; image_url: string })[]) => void
  maxImages?: number
  disabled?: boolean
  /** If provided, files are sent via multipart POST to this URL (e.g. /api/gyms/:id/images). */
  uploadUrl?: string
}

interface UploadingImage {
  id: string
  file: File
  progress: number
  error?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function ImageUpload({ images, onImagesChange, maxImages = 5, disabled = false, uploadUrl }: ImageUploadProps) {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAddMore = images.length + uploadingImages.length < maxImages

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !canAddMore) return

    const validFiles = Array.from(files).filter((file) => {
      // Check file type
      if (!file.type.startsWith("image/")) {
        return false
      }
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return false
      }
      return true
    })

    // Limit to remaining slots
    const remainingSlots = maxImages - images.length - uploadingImages.length
    const filesToUpload = validFiles.slice(0, remainingSlots)

    if (uploadUrl) {
      bulkUpload(filesToUpload)
    } else {
      filesToUpload.forEach(uploadFileDirect)
    }
  }

  const uploadFile = async (file: File) => {
    // This function body is intentionally left empty – retained only to avoid breaking legacy imports.
    console.warn('uploadFile is deprecated and will be removed in future releases.')
  }

  /**
   * Legacy direct-to-Bunny upload (one request per file). Will be removed once all
   * screens migrate to the backend upload flow.
   */
  const uploadFileDirect = async (file: File) => {
    if (!uploadUrl) {
      // Direct upload to Bunny (legacy flow)
      const result = await uploadToBunny(file, `image-${Date.now()}`)
      if (result.success && result.url) {
        onImagesChange([...images, result.url])
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    }
  }

  /**
   * Bulk upload files to backend in a single multipart request.
   */
  const bulkUpload = async (files: File[]) => {
    // Mark all files as uploading
    const newUploading: UploadingImage[] = files.map((file) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
    }))
    setUploadingImages((prev) => [...prev, ...newUploading])

    try {
      const fullUrl = uploadUrl!.startsWith('http') ? uploadUrl! : `${API_BASE_URL}${uploadUrl}`
      const formData = new FormData()
      files.forEach((file) => formData.append('file', file))

      const response = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (response.ok) {
        let json: any = null;
        try {
          json = await response.json();
        } catch (err) {
          // Empty or invalid JSON – proceed without it
        }

        const uploadedItems = (json?.data || []).map((item: any) =>
          item?.image_url ? item : { image_url: item },
        )

        const newImagesArr = uploadedItems.length > 0 ? uploadedItems : ([] as any);
        if (newImagesArr.length === 0 && json === null) {
          // Fallback: no JSON but request succeeded – assume server stored names sequentially
          // We can't know URLs; refresh will fetch latest.
        } else {
          onImagesChange([...images, ...newImagesArr])
        }
      } else {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }
    } catch (err: any) {
      console.error('Bulk upload error:', err)
      setUploadingImages((prev) =>
        prev.map((up) => ({ ...up, error: err?.message || 'Upload failed', progress: 100 })),
      )
    } finally {
      // Clear uploading states for these files
      setUploadingImages((prev) => prev.filter((up) => !files.includes(up.file)))
    }
  }

  const removeImage = async (index: number) => {
    const target = images[index]
    const newImages = images.filter((_, i) => i !== index)

    // If the image came from backend (object with id) and we have uploadUrl, call DELETE
    if (uploadUrl && typeof target !== 'string' && target?.id) {
      try {
        const entityMatch = uploadUrl.match(/\/api\/(gyms|trainers)\//)
        if (entityMatch) {
          const entity = entityMatch[1]
          const deleteUrl = `${API_BASE_URL}/api/${entity}/images/${target.id}`
          await fetch(deleteUrl, { method: 'DELETE', credentials: 'include' })
        }
      } catch (err) {
        console.error('Failed to delete image on backend:', err)
      }
    }

    onImagesChange(newImages)
  }

  const removeUploadingImage = (id: string) => {
    setUploadingImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && !disabled && (
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center mb-4">
              Drag and drop images here, or click to select
              <br />
              <span className="text-xs">Max {maxImages} images • JPG, PNG, WebP • Max 10MB each</span>
            </p>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Select Images
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </CardContent>
        </Card>
      )}

      {/* Max images reached */}
      {!canAddMore && (
        <Alert>
          <AlertDescription>Maximum of {maxImages} images reached. Remove an image to add more.</AlertDescription>
        </Alert>
      )}

      {/* Uploading Images */}
      {uploadingImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading...</h4>
          {uploadingImages.map((uploadingImage) => (
            <Card key={uploadingImage.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    {uploadingImage.error ? (
                      <X className="h-5 w-5 text-destructive" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadingImage.file.name}</p>
                    {uploadingImage.error ? (
                      <p className="text-xs text-destructive">{uploadingImage.error}</p>
                    ) : (
                      <Progress value={uploadingImage.progress} className="mt-1" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadingImage(uploadingImage.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Uploaded Images ({images.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <Card key={`image-${index}-${typeof image === 'string' ? image : image.image_url}`} className="overflow-hidden">
                <CardContent className="p-0 relative group">
                  <img
                    src={typeof image === 'string' ? image : image.image_url}
                    alt={`Gym image ${index + 1}`}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=128&width=200&query=broken image"
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(index)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
