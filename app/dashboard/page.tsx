"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Users, Building2, UserCheck, Briefcase, Loader2, UserX, MapPin } from "lucide-react"
import { toast } from "sonner"
import { dashboardApi } from "@/lib/api"

interface DashboardStats {
  totalTrainers: number
  activeTrainers: number
  inactiveTrainers: number
  freelancers: number
  staffTrainers: number
  unassignedTrainers: number
  totalGyms: number
  activeGyms: number
  inactiveGyms: number
  topProvincesByTrainers: Array<{ provinceId: number; provinceName: string; trainerCount: number }>
  topProvincesByGyms: Array<{ provinceId: number; provinceName: string; gymCount: number }>
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        
        // Use the dedicated dashboard API endpoint
        const response = await dashboardApi.getStats()
        
        // Extract data from the API response
        let statsData: DashboardStats
        if (response?.data) {
          statsData = response.data
        } else if (response?.success && response) {
          // Handle case where response is the data directly
          statsData = response as any
        } else {
          throw new Error("Invalid response format from dashboard API")
        }

        setStats(statsData)
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ครูมวยที่เปิดใช้งาน</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeTrainers}</div>
                  <p className="text-xs text-muted-foreground">ครูมวยที่แสดงในระบบ</p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">ครูมวยอิสระ</CardTitle>
                  <Briefcase className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-800">{stats.freelancers}</div>
                  <p className="text-xs text-orange-600">ครูมวยอิสระ (Freelance)</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">ครูมวยประจำยิม</CardTitle>
                  <UserCheck className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800">{stats.staffTrainers}</div>
                  <p className="text-xs text-blue-600">ครูมวยประจำ</p>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">รอจัดสรร</CardTitle>
                  <UserX className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-800">{stats.unassignedTrainers}</div>
                  <p className="text-xs text-red-600">ครูมวยที่ยังไม่มียิม</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Gyms Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">ยิมทั้งหมด</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ยิมทั้งหมด</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGyms}</div>
                  <p className="text-xs text-muted-foreground">ยิมที่ลงทะเบียนทั้งหมด</p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">ยิมที่เปิดแสดง</CardTitle>
                  <Building2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">{stats.activeGyms}</div>
                  <p className="text-xs text-green-600">กำลังแสดงผล</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-gray-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-800">ยิมที่ปิดแสดง</CardTitle>
                  <Building2 className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">{stats.inactiveGyms}</div>
                  <p className="text-xs text-gray-600">ไม่แสดงผล</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Top Provinces Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">จังหวัดที่มีการใช้งานมากที่สุด</h2>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
                            {/* Top 5 Provinces by Gyms */}
                            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    <span>TOP 5 จังหวัดที่มียิมมากที่สุด</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topProvincesByGyms && stats.topProvincesByGyms.length > 0 ? (
                      stats.topProvincesByGyms.map((province, index) => (
                        <div key={province.provinceId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                              <span className="text-sm font-semibold text-green-800">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{province.provinceName}</p>
                              <p className="text-sm text-gray-500">จังหวัด</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{province.gymCount}</div>
                            <p className="text-xs text-green-500">ยิม</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">ไม่มีข้อมูลยิมตามจังหวัด</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Top 5 Provinces by Trainers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>TOP 5 จังหวัดที่มีครูมวยมากที่สุด</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topProvincesByTrainers && stats.topProvincesByTrainers.length > 0 ? (
                      stats.topProvincesByTrainers.map((province, index) => (
                        <div key={province.provinceId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                              <span className="text-sm font-semibold text-blue-800">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{province.provinceName}</p>
                              <p className="text-sm text-gray-500">จังหวัด</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{province.trainerCount}</div>
                            <p className="text-xs text-blue-500">คน</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">ไม่มีข้อมูลครูมวยตามจังหวัด</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
} 