"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Users, Building2, UserCheck, Briefcase, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { trainersApi, gymsApi } from "@/lib/api"

interface DashboardStats {
  totalTrainers: number
  activeTrainers: number
  freelancers: number
  staffTrainers: number
  totalGyms: number
  activeGyms: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const [trainersData, gymsData] = await Promise.all([
          trainersApi.getAll(),
          gymsApi.getAll()
        ])

        // Calculate statistics
        const activeTrainers = trainersData.items.filter((trainer: any) => trainer.is_active).length
        const freelancers = trainersData.items.filter((trainer: any) => trainer.is_freelance && trainer.is_active).length
        const staffTrainers = trainersData.items.filter((trainer: any) => !trainer.is_freelance && trainer.is_active).length
        const activeGyms = gymsData.filter((gym: any) => gym.is_active).length

        setStats({
          totalTrainers: trainersData.items.length,
          activeTrainers,
          freelancers,
          staffTrainers,
          totalGyms: gymsData.length,
          activeGyms
        })
        setError(null)
      } catch (err) {
        setError("Failed to fetch dashboard data")
        console.error("Error fetching dashboard data:", err)
        toast.error("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (error || !stats) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">{error || "ไม่สามารถโหลดข้อมูลได้"}</p>
            <Button onClick={() => window.location.reload()}>ลองใหม่</Button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ภาพรวมการใช้งาน</h1>
            <p className="text-muted-foreground">สรุปการใช้งานทั้งหมดในระบบ</p>
          </div>

          {/* Trainers Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">ครูมวยทั้งหมด</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">จำนวนครูมวยทั้งหมด</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeTrainers}</div>
                  <p className="text-xs text-muted-foreground">ครูมวยที่แสดงในระบบ</p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">อิสระ</CardTitle>
                  <Briefcase className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-800">{stats.freelancers}</div>
                  <p className="text-xs text-orange-600">ครูมวยอิสระ (Freelance)</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Gyms & Staff Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">ยิมและครูมวยประจำ</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ยิมที่ลงทะเบียนแล้ว</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGyms}</div>
                  <p className="text-xs text-muted-foreground">ยิมที่ลงทะเบียนทั้งหมด</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ยิมที่เปิดแสดง</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeGyms}</div>
                  <p className="text-xs text-muted-foreground">กำลังแสดงผล</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ครูมวยประจำยิม</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.staffTrainers}</div>
                  <p className="text-xs text-muted-foreground">ครูมวยประจำ</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
} 