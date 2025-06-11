"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { TrainerForm } from "@/components/trainer-form"
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
import { Search, Edit, Trash2, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { Trainer } from "@/lib/types"
import { trainersApi, gymsApi } from "@/lib/api"

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [gyms, setGyms] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)
  const [filterFreelancer, setFilterFreelancer] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch trainers and gyms from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [trainersData, gymsData] = await Promise.all([
          trainersApi.getAll(),
          gymsApi.getAll()
        ])
        console.log('Trainers API Response:', trainersData); // Log trainers data
        setTrainers(trainersData.items)
        setGyms(gymsData)
        setError(null)
      } catch (err) {
        setError("Failed to fetch data")
        console.error("Error fetching data:", err)
        toast.error("ไม่สามารถโหลดข้อมูลได้")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])
  console.log('trainers', trainers)
  const filteredTrainers = trainers.filter((trainer) => {
    const fullNameTh = `${trainer.first_name_th} ${trainer.last_name_th}`.trim()
    const fullNameEn = `${trainer.first_name_en} ${trainer.last_name_en}`.trim()
    const matchesSearch =
      fullNameTh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFreelancer =
      filterFreelancer === "all" ||
      (filterFreelancer === "freelancer" && trainer.is_freelance) ||
      (filterFreelancer === "staff" && !trainer.is_freelance)
    return matchesSearch && matchesFreelancer
  })

  const handleAddTrainer = async (trainerData: Omit<Trainer, "id" | "joinedDate">) => {
    try {
      const newTrainer = await trainersApi.create(trainerData)
      setTrainers([...trainers, newTrainer])
      setIsAddDialogOpen(false)
      const displayName = `${trainerData.first_name_th} ${trainerData.last_name_th}`.trim()
      toast.success(`เพิ่มครูมวย "${displayName}" สำเร็จ`)
    } catch (err) {
      console.error("Error adding trainer:", err)
      toast.error("ไม่สามารถเพิ่มครูมวยได้")
    }
  }

  const handleEditTrainer = async (trainerData: Omit<Trainer, "id" | "joinedDate">) => {
    if (editingTrainer) {
      try {
        const updatedTrainer = await trainersApi.update(editingTrainer.id, trainerData)
        setTrainers(trainers.map((trainer) => (trainer.id === editingTrainer.id ? updatedTrainer : trainer)))
        setEditingTrainer(null)
        const displayName = `${trainerData.first_name_th} ${trainerData.last_name_th}`.trim()
        toast.success(`แก้ไขครูมวย "${displayName}" สำเร็จ`)
      } catch (err) {
        console.error("Error updating trainer:", err)
        toast.error("ไม่สามารถแก้ไขครูมวยได้")
      }
    }
  }

  const handleDeleteTrainer = async (trainerId: string) => {
    try {
      const trainer = trainers.find((t) => t.id === trainerId)
      await trainersApi.delete(trainerId)
      setTrainers(trainers.filter((trainer) => trainer.id !== trainerId))
      if (trainer) {
        const displayName = `${trainer.first_name_th} ${trainer.last_name_th}`.trim()
        toast.success(`ลบครูมวย "${displayName}" สำเร็จ`)
      }
    } catch (err) {
      console.error("Error deleting trainer:", err)
      toast.error("ไม่สามารถลบครูมวยได้")
    }
  }

  const getGymName = (gymId?: string) => {
    if (!gymId) return "ไม่ได้มอบหมาย"
    const gym = gyms.find((g) => g.id === gymId)
    if (!gym) return "ยิมที่ไม่รู้จัก"

    // Handle both old string format and new bilingual format
    if (typeof gym.name === "string") {
      return gym.name
    } else {
      return gym.primaryGym?.name_th || gym.primaryGym?.name_en || "ยิมที่ไม่รู้จัก"
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
              <h1 className="text-3xl font-bold tracking-tight">ครูมวย</h1>
              <p className="text-muted-foreground">จัดการครูมวยในแพลตฟอร์ม</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>เพิ่มรายการใหม่</Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl w-[98vw] max-h-[98vh] overflow-hidden p-0">
                <div className="p-6 pb-0">
                  <DialogHeader>
                    <DialogTitle>เพิ่มครูมวยใหม่</DialogTitle>
                  </DialogHeader>
                </div>
                <div className="px-6 pb-6">
                  <TrainerForm onSubmit={handleAddTrainer} onCancel={() => setIsAddDialogOpen(false)} />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาครูมวย..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterFreelancer} onValueChange={setFilterFreelancer}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="กรองตามประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ครูมวยทั้งหมด</SelectItem>
                <SelectItem value="freelancer">ฟรีแลนซ์เท่านั้น</SelectItem>
                <SelectItem value="staff">พนักงานเท่านั้น</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ยิมที่มอบหมาย</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainers.map((trainer) => {
                  const displayNameTh = `${trainer.first_name_th} ${trainer.last_name_th}`.trim()
                  const displayNameEn = `${trainer.first_name_en} ${trainer.last_name_en}`.trim()

                  return (
                    <TableRow key={trainer.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{displayNameTh}</div>
                          {displayNameEn && <div className="text-sm text-muted-foreground">{displayNameEn}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{trainer.phone || "ไม่ได้ระบุ"}</TableCell>
                      <TableCell>
                        <Badge variant={trainer.is_freelance ? "default" : "secondary"}>
                          {trainer.is_freelance ? "ฟรีแลนซ์" : "พนักงาน"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {trainer.is_freelance ? <Badge variant="outline">อิสระ</Badge> : getGymName(trainer.primaryGym?.id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={trainer.is_active ? "default" : "secondary"}>
                          {trainer.is_active ? "เปิดใช้งาน" : "ปิดการใช้งาน"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog
                            open={editingTrainer?.id === trainer.id}
                            onOpenChange={(open) => !open && setEditingTrainer(null)}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setEditingTrainer(trainer)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl w-[98vw] max-h-[98vh] overflow-hidden p-0">
                              <div className="p-6 pb-0">
                                <DialogHeader>
                                  <DialogTitle>แก้ไขครูมวย</DialogTitle>
                                </DialogHeader>
                              </div>
                              <div className="px-6 pb-6">
                                <TrainerForm trainer={trainer} onSubmit={handleEditTrainer} onCancel={() => setEditingTrainer(null)} />
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
                                  การดำเนินการนี้ไม่สามารถยกเลิกได้ การดำเนินการนี้จะลบครูมวยและข้อมูลของเขาออกจากเซิร์ฟเวอร์ของเราอย่างถาวร
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTrainer(trainer.id)}>ลบ</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredTrainers.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">ไม่พบครูมวย</p>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
} 