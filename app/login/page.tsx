"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState("")
  const { login, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const loggedIn = await login(email, password)
      if (loggedIn) {
        setSuccess('เข้าสู่ระบบสำเร็จ')
        setTimeout(() => router.push('/dashboard'), 1500)
      } else {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
      }
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.info('Login attempt failed:', error instanceof Error ? error.message : 'Unknown error')
      }
      
      // Handle specific error types
      if (error instanceof Error) {
        const errorMessage = error.message
        
        if (errorMessage.includes('Rate limit exceeded')) {
          const retryMatch = errorMessage.match(/(\d+)\s*seconds?/)
          const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : 0
          if (retryAfter > 0) {
            const minutes = Math.floor(retryAfter / 60)
            const seconds = retryAfter % 60
            const timeString = minutes > 0 
              ? `${minutes} นาที ${seconds} วินาที`
              : `${seconds} วินาที`
            setError(`คุณพยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ใน ${timeString}`)
          } else {
            setError('คุณพยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่อีกสักครู่')
          }
        }
        else if (errorMessage === 'Invalid email or password') {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        } else if (errorMessage.includes('password')) {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        } else {
          switch (errorMessage) {
            case 'UNAUTHORIZED':
              setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
              break
            case 'FORBIDDEN':
              setError('บัญชีของคุณไม่มีสิทธิ์เข้าถึงระบบนี้')
              break
            case 'SERVER_ERROR':
              setError('เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง')
              break
            default:
              setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง')
          }
        }
      } else {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2">
              <div>
                <CardTitle className="text-2xl">
                  ล็อกอินเข้าสู่ระบบแอดมิน
                </CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@mymuaythai.app"
                value={email}
                autoComplete="off"
                autoFocus
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="ใส่รหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </div>
              </Alert>
            )}
            {success && (
              <Alert variant="default" className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || !!success}>
              {isLoading ? "กำลังเข้าสู่ระบบ..." : success ? "กำลังเปลี่ยนหน้า..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
          
        </CardContent>
      </Card>
    </div>
  )
} 