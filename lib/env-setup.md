# Bunny.net Environment Variables Setup

To use Bunny.net for image uploads, you need to set up the following environment variables in your `.env.local` file:

\`\`\`env
# Bunny.net Configuration
NEXT_PUBLIC_BUNNY_STORAGE_ZONE=your-storage-zone-name
NEXT_PUBLIC_BUNNY_ACCESS_KEY=your-storage-zone-access-key
NEXT_PUBLIC_BUNNY_BASE_URL=https://your-zone.b-cdn.net
\`\`\`

## How to get these values:

1. **Storage Zone Name**: 
   - Go to your Bunny.net dashboard
   - Navigate to "Storage" → "Storage Zones"
   - Copy your storage zone name

2. **Access Key**:
   - In your storage zone settings
   - Go to "FTP & API Access"
   - Copy the "Password" (this is your access key)

3. **Base URL**:
   - In your storage zone settings
   - Copy the "Pull Zone URL" or create a pull zone
   - Format: https://your-zone.b-cdn.net

## Security Note:
Since these are NEXT_PUBLIC_ variables, they will be exposed to the client. Make sure your Bunny.net storage zone is configured with appropriate access controls.
