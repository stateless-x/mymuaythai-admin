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
  const displayName = typeof gym.name === "string" ? gym.name : gym.name.th || gym.name.en
  const displayLocation = typeof gym.location === "string" ? gym.location : gym.location.th || gym.location.en
  const displayDescription =
    typeof gym.description === "string" ? gym.description : gym.description?.th || gym.description?.en

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {displayName}
            <Badge variant={gym.status === "active" ? "default" : "secondary"}>{gym.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium flex items-center mb-2">
              <MapPin className="h-4 w-4 mr-2" />
              Location
            </h4>
            <p className="text-sm text-muted-foreground">{displayLocation}</p>
          </div>

          {displayDescription && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{displayDescription}</p>
            </div>
          )}

          <div className="flex space-x-2">
            {gym.googleMapUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(gym.googleMapUrl, "_blank")}>
                <MapPin className="h-4 w-4 mr-2" />
                View on Maps
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}

            {gym.youtubeUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(gym.youtubeUrl, "_blank")}>
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
                <div key={index} className="aspect-video rounded-lg overflow-hidden border">
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

      {/* Facilities */}
      {gym.facilities && (
        <Card>
          <CardHeader>
            <CardTitle>Facilities & Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {/* Handle both old array format and new bilingual format */}
              {Array.isArray(gym.facilities)
                ? gym.facilities.map((facility) => (
                    <Badge key={facility} variant="secondary">
                      {facility}
                    </Badge>
                  ))
                : (gym.facilities.th || []).map((facility) => (
                    <Badge key={facility} variant="secondary">
                      {facility}
                    </Badge>
                  ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
