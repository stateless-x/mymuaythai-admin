"use client"

import { AdminLayout } from "@/components/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users, Building2, UserCheck, Briefcase } from "lucide-react"
import { mockTrainers, mockGyms } from "@/lib/mock-data"

export default function AdminDashboard() {
  const activeTrainers = mockTrainers.filter((trainer) => trainer.status === "active").length
  const activeGyms = mockGyms.filter((gym) => gym.status === "active").length
  const freelancers = mockTrainers.filter((trainer) => trainer.isFreelancer && trainer.status === "active").length
  const staffTrainers = mockTrainers.filter((trainer) => !trainer.isFreelancer && trainer.status === "active").length

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
                  <div className="text-2xl font-bold">{activeTrainers}</div>
                  <p className="text-xs text-muted-foreground">ครูมวยที่แสดงในระบบ</p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">อิสระ</CardTitle>
                  <Briefcase className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-800">{freelancers}</div>
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
                  <div className="text-2xl font-bold">{mockGyms.length}</div>
                  <p className="text-xs text-muted-foreground">ยิมที่ลงทะเบียนทั้งหมด</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ยิมที่เปิดแสดง</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeGyms}</div>
                  <p className="text-xs text-muted-foreground">กำลังแสดงผล</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ครูมวยประจำยิม</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{staffTrainers}</div>
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
