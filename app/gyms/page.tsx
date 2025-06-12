"use client"

import { useState, useEffect } from "react"
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
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Gym } from "@/lib/types"
import { gymsApi } from "@/lib/api"

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingGym, setEditingGym] = useState<Gym | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const truncateId = (id: string) => {
    if (id.length <= 6) return id
    return `${id.slice(0, 4)}...${id.slice(-2)}`
  }

  // Helper function to format phone numbers
  const formatPhone = (phone: string) => {
    if (!phone) return "ไม่ได้ระบุ"
    
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '')

    if (digits.length === 10) {
      // Format as XXX-XXX-XXXX
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    } else if (digits.length === 9) {
      // Format as XX-XXX-XXXX
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    } else {
      return phone
    }
  }

  const fetchGyms = async () => {
    try {
      setIsLoading(true)
      const data = await gymsApi.getAll()
      setGyms(data)
      setError(null)
    } catch (err) {
      setError("Failed to fetch gyms")
      console.error("Error fetching gyms:", err)
      toast.error("ไม่สามารถโหลดข้อมูลยิมได้")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGyms()
  }, [])

  const closeEditDialog = () => {
    setEditingGym(null)
    fetchGyms()
  }

  const filteredGyms = gyms.filter((gym) => {
    const gymName = `${gym.name_th} ${gym.name_en}`.trim()
    const gymLocation = gym.province ? `${gym.province.name_th} ${gym.province.name_en}`.trim() : ""

    return (
      gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gymLocation.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleAddGym = async (gymData: Omit<Gym, "id" | "joinedDate">) => {
    try {
      const newGym = await gymsApi.create(gymData)
      setGyms([...gyms, newGym])
      setIsAddDialogOpen(false)
      toast.success("เพิ่มยิมสำเร็จ")
    } catch (err) {
      console.error("Error adding gym:", err)
      toast.error("ไม่สามารถเพิ่มยิมได้")
    }
  }

  const handleEditGym = async (gymData: Omit<Gym, "id" | "joinedDate">) => {
    if (editingGym) {
      try {
        const updatedGym = await gymsApi.update(editingGym.id, gymData)
        setGyms(gyms.map((gym) => (gym.id === editingGym.id ? updatedGym : gym)))
        closeEditDialog() // Use helper function
        toast.success("แก้ไขยิมสำเร็จ")
      } catch (err) {
        console.error("Error updating gym:", err)
        toast.error("ไม่สามารถแก้ไขยิมได้")
      }
    }
  }

  const handleSaveGym = async (gymData: Omit<Gym, "id" | "joinedDate">) => {
    if (editingGym) {
      try {
        const updatedGym = await gymsApi.update(editingGym.id, gymData)        
        setGyms(gyms.map((gym) => 
          gym.id === editingGym.id ? { ...gym, ...updatedGym } : gym
        ))
      } catch (err) {
        console.error("Error saving gym:", err)
        throw err 
      }
    }
  }

  const handleDeleteGym = async (gymId: string) => {
    try {
      await gymsApi.delete(gymId)
      setGyms(gyms.filter((gym) => gym.id !== gymId))
      toast.success("ลบยิมสำเร็จ")
    } catch (err) {
      console.error("Error deleting gym:", err)
      toast.error("ไม่สามารถลบยิมได้")
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>ลองใหม่</Button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
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
                  <Plus className="mr-2 h-4 w-4" />สร้างยิมใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl w-[98vw] max-h-[98vh] p-0 flex flex-col">
                <div className="p-6 pb-4 border-b flex-shrink-0">
                  <DialogHeader>
                    <DialogTitle>เพิ่มยิมใหม่</DialogTitle>
                  </DialogHeader>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-6">
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
                    <TableCell className="font-mono text-sm">{truncateId(gym.id)}</TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{gym.name_th}</div>
                        {gym.name_en && (
                          <div className="text-sm text-muted-foreground">{gym.name_en}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatPhone(gym.phone || "")}</TableCell>
                    <TableCell>
                      <Badge 
                      className={`pointer-events-none ${gym.is_active ? "bg-green-500" : "bg-gray-100"}`}
                      variant={gym.is_active ? "default" : "secondary"}>
        
                        {gym.is_active ? "เปิดใช้งาน" : "ปิดการใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Dialog 
                          open={editingGym?.id === gym.id} 
                          onOpenChange={(open) => {
                            if (!open) {
                              closeEditDialog()
                            }
                          }}
                          modal={true}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditingGym(gym)
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent 
                            className="max-w-6xl w-[98vw] max-h-[98vh] p-0 flex flex-col"
                            onEscapeKeyDown={() => closeEditDialog()}
                            onPointerDownOutside={() => closeEditDialog()}
                          >
                            <div className="p-6 pb-4 border-b flex-shrink-0">
                              <DialogHeader>
                                <DialogTitle>แก้ไขยิม</DialogTitle>
                              </DialogHeader>
                            </div>
                            <div className="flex-1 overflow-y-auto px-6 pb-6">
                              <GymForm 
                                gym={gym} 
                                onSubmit={handleEditGym} 
                                onCancel={() => closeEditDialog()}
                                onSaveOnly={handleSaveGym}
                              />
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