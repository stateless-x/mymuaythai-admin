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
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  disabled?: boolean
}

interface UploadingImage {
  id: string
  file: File
  progress: number
  error?: string
}

export function ImageUpload({ images, onImagesChange, maxImages = 5, disabled = false }: ImageUploadProps) {
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

    filesToUpload.forEach(uploadFile)
  }

  const uploadFile = async (file: File) => {
    const uploadId = Date.now().toString() + Math.random().toString(36).substr(2, 9)

    // Add to uploading state
    const newUploadingImage: UploadingImage = {
      id: uploadId,
      file,
      progress: 0,
    }

    setUploadingImages((prev) => [...prev, newUploadingImage])

    try {
      // Simulate progress (since Bunny.net doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadingImages((prev) =>
          prev.map((img) => (img.id === uploadId ? { ...img, progress: Math.min(img.progress + 10, 90) } : img)),
        )
      }, 200)

      // Upload to Bunny.net
      const result = await uploadToBunny(file, `gym-${Date.now()}`)

      clearInterval(progressInterval)

      if (result.success && result.url) {
        // Add to images array
        onImagesChange([...images, result.url])

        // Remove from uploading state
        setUploadingImages((prev) => prev.filter((img) => img.id !== uploadId))
      } else {
        // Show error
        setUploadingImages((prev) =>
          prev.map((img) =>
            img.id === uploadId ? { ...img, progress: 100, error: result.error || "Upload failed" } : img,
          ),
        )
      }
    } catch (error) {
      setUploadingImages((prev) =>
        prev.map((img) => (img.id === uploadId ? { ...img, progress: 100, error: "Upload failed" } : img)),
      )
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
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
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0 relative group">
                  <img
                    src={image || "/placeholder.svg"}
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
