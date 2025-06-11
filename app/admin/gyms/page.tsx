"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { GymForm } from "@/components/gym-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import type { Gym } from "@/lib/types"
import { mockGyms } from "@/lib/mock-data"

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>(mockGyms)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingGym, setEditingGym] = useState<Gym | null>(null)

  const filteredGyms = gyms.filter((gym) => {
    const gymName = typeof gym.name === "string" ? gym.name : gym.name.th + " " + gym.name.en
    const gymLocation = typeof gym.location === "string" ? gym.location : gym.location.th + " " + gym.location.en

    return (
      gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gymLocation.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleAddGym = (gymData: Omit<Gym, "id" | "joinedDate">) => {
    const newGym: Gym = {
      ...gymData,
      id: Date.now().toString(),
      joinedDate: new Date().toISOString().split("T")[0],
    }
    setGyms([...gyms, newGym])
    setIsAddDialogOpen(false)
  }

  const handleEditGym = (gymData: Omit<Gym, "id" | "joinedDate">) => {
    if (editingGym) {
      setGyms(gyms.map((gym) => (gym.id === editingGym.id ? { ...gym, ...gymData } : gym)))
      setEditingGym(null)
    }
  }

  const handleDeleteGym = (gymId: string) => {
    setGyms(gyms.filter((gym) => gym.id !== gymId))
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">ยิม</h1>
              <p className="text-muted-foreground">จัดการยิมในแพลตฟอร์ม</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />+ เพิ่มรายการใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl w-[98vw] max-h-[98vh] overflow-hidden p-0">
                <div className="p-6 pb-0">
                  <DialogHeader>
                    <DialogTitle>เพิ่มยิมใหม่</DialogTitle>
                  </DialogHeader>
                </div>
                <div className="px-6 pb-6">
                  <GymForm onSubmit={handleAddGym} onCancel={() => setIsAddDialogOpen(false)} />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหายิม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสยิม</TableHead>
                  <TableHead>ชื่อยิม</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGyms.map((gym) => (
                  <TableRow key={gym.id}>
                    <TableCell className="font-mono text-sm">{gym.id}</TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{typeof gym.name === "object" ? gym.name.th : gym.name}</div>
                        {typeof gym.name === "object" && gym.name.en && (
                          <div className="text-sm text-muted-foreground">{gym.name.en}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{gym.phone || "ไม่ได้ระบุ"}</TableCell>
                    <TableCell>
                      <Badge variant={gym.status === "active" ? "default" : "secondary"}>
                        {gym.status === "active" ? "เปิดใช้งาน" : "ปิดการใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Dialog open={editingGym?.id === gym.id} onOpenChange={(open) => !open && setEditingGym(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingGym(gym)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl w-[98vw] max-h-[98vh] overflow-hidden p-0">
                            <div className="p-6 pb-0">
                              <DialogHeader>
                                <DialogTitle>แก้ไขยิม</DialogTitle>
                              </DialogHeader>
                            </div>
                            <div className="px-6 pb-6">
                              <GymForm gym={gym} onSubmit={handleEditGym} onCancel={() => setEditingGym(null)} />
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
                              <AlertDialogDescription>
                                การดำเนินการนี้ไม่สามารถยกเลิกได้ การดำเนินการนี้จะลบยิมและข้อมูลของมันออกจากเซิร์ฟเวอร์ของเราอย่างถาวร
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteGym(gym.id)}>ลบ</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredGyms.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">ไม่พบยิม</p>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
