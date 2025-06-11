interface BunnyUploadResponse {
  success: boolean
  url?: string
  error?: string
}

interface BunnyConfig {
  storageZone: string
  accessKey: string
  baseUrl: string
}

// You'll need to set these environment variables
const BUNNY_CONFIG: BunnyConfig = {
  storageZone: process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || "your-storage-zone",
  accessKey: process.env.NEXT_PUBLIC_BUNNY_ACCESS_KEY || "your-access-key",
  baseUrl: process.env.NEXT_PUBLIC_BUNNY_BASE_URL || "https://your-zone.b-cdn.net",
}

export async function uploadToBunny(file: File, fileName: string): Promise<BunnyUploadResponse> {
  try {
    // Generate unique filename to avoid conflicts
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const uniqueFileName = `gym-images/${timestamp}-${fileName}.${extension}`

    // Create FormData for the upload
    const formData = new FormData()
    formData.append("file", file)

    // Upload to Bunny.net Storage API
    const uploadResponse = await fetch(`https://storage.bunnycdn.com/${BUNNY_CONFIG.storageZone}/${uniqueFileName}`, {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_CONFIG.accessKey,
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`)
    }

    // Return the CDN URL
    const cdnUrl = `${BUNNY_CONFIG.baseUrl}/${uniqueFileName}`

    return {
      success: true,
      url: cdnUrl,
    }
  } catch (error) {
    console.error("Bunny upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

export async function deleteFromBunny(fileName: string): Promise<boolean> {
  try {
    const response = await fetch(`https://storage.bunnycdn.com/${BUNNY_CONFIG.storageZone}/${fileName}`, {
      method: "DELETE",
      headers: {
        AccessKey: BUNNY_CONFIG.accessKey,
      },
    })

    return response.ok
  } catch (error) {
    console.error("Bunny delete error:", error)
    return false
  }
}
