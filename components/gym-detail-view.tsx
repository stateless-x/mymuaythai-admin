"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, MapPin, Video, ImageIcon } from "lucide-react"
import type { Gym } from "@/lib/types"

interface GymDetailViewProps {
  gym: Gym
}

export function GymDetailView({ gym }: GymDetailViewProps) {
  // Get display name - prioritize Thai, fallback to English
  const displayName = gym.name_th || gym.name_en || "ไม่ระบุชื่อ"
  const displayDescription = gym.description_th || gym.description_en

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {displayName}
            <Badge variant={gym.is_active ? "default" : "secondary"}>
              {gym.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {gym.phone && (
            <div>
              <h4 className="font-medium mb-2">เบอร์โทรศัพท์</h4>
              <p className="text-sm text-muted-foreground">{gym.phone}</p>
            </div>
          )}

          {gym.email && (
            <div>
              <h4 className="font-medium mb-2">อีเมล</h4>
              <p className="text-sm text-muted-foreground">{gym.email}</p>
            </div>
          )}

          {displayDescription && (
            <div>
              <h4 className="font-medium mb-2">คำอธิบาย</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{displayDescription}</p>
            </div>
          )}

          <div className="flex space-x-2">
            {gym.map_url && (
              <Button variant="outline" size="sm" onClick={() => window.open(gym.map_url, "_blank")}>
                <MapPin className="h-4 w-4 mr-2" />
                View on Maps
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}

            {gym.youtube_url && (
              <Button variant="outline" size="sm" onClick={() => window.open(gym.youtube_url, "_blank")}>
                <Video className="h-4 w-4 mr-2" />
                Watch Video
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      {gym.images && gym.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" />
              Images ({gym.images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gym.images.map((image, index) => (
                <div key={`gym-image-${index}-${image}`} className="aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${displayName} - Image ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(image, "_blank")}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=200&width=300&query=gym image"
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {gym.tags && gym.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {gym.tags.map((tag, index) => (
                <Badge key={`gym-tag-${index}-${tag}`} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
