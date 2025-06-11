"use client"

import { useState } from "react"
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
import { Search, Edit, Trash2 } from "lucide-react"
import type { Trainer } from "@/lib/types"
import { mockTrainers, mockGyms } from "@/lib/mock-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SuccessToast, useSuccessToast } from "@/components/success-toast"

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>(mockTrainers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)
  const [filterFreelancer, setFilterFreelancer] = useState<string>("all")

  const { isVisible: toastVisible, message: toastMessage, showToast, hideToast } = useSuccessToast()

  const filteredTrainers = trainers.filter((trainer) => {
    const fullNameTh = `${trainer.firstName.th} ${trainer.lastName.th}`.trim()
    const fullNameEn = `${trainer.firstName.en} ${trainer.lastName.en}`.trim()
    const matchesSearch =
      fullNameTh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFreelancer =
      filterFreelancer === "all" ||
      (filterFreelancer === "freelancer" && trainer.isFreelancer) ||
      (filterFreelancer === "staff" && !trainer.isFreelancer)
    return matchesSearch && matchesFreelancer
  })

  const handleAddTrainer = (trainerData: Omit<Trainer, "id" | "joinedDate">) => {
    const newTrainer: Trainer = {
      ...trainerData,
      id: Date.now().toString(),
      joinedDate: new Date().toISOString().split("T")[0],
    }
    setTrainers([...trainers, newTrainer])
    setIsAddDialogOpen(false)
    const displayName = `${trainerData.firstName.th} ${trainerData.lastName.th}`.trim()
    showToast(`Trainer "${displayName}" has been added successfully!`)
  }

  const handleEditTrainer = (trainerData: Omit<Trainer, "id" | "joinedDate">) => {
    if (editingTrainer) {
      setTrainers(
        trainers.map((trainer) => (trainer.id === editingTrainer.id ? { ...trainer, ...trainerData } : trainer)),
      )
      setEditingTrainer(null)
      const displayName = `${trainerData.firstName.th} ${trainerData.lastName.th}`.trim()
      showToast(`Trainer "${displayName}" has been updated successfully!`)
    }
  }

  const handleDeleteTrainer = (trainerId: string) => {
    const trainer = trainers.find((t) => t.id === trainerId)
    setTrainers(trainers.filter((trainer) => trainer.id !== trainerId))
    if (trainer) {
      const displayName = `${trainer.firstName.th} ${trainer.lastName.th}`.trim()
      showToast(`Trainer "${displayName}" has been deleted successfully!`)
    }
  }

  const getGymName = (gymId?: string) => {
    if (!gymId) return "Not assigned"
    const gym = mockGyms.find((g) => g.id === gymId)
    if (!gym) return "Unknown gym"

    // Handle both old string format and new bilingual format
    if (typeof gym.name === "string") {
      return gym.name
    } else {
      return gym.name.th || gym.name.en || "Unknown gym"
    }
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
                  const displayNameTh = `${trainer.firstName.th} ${trainer.lastName.th}`.trim()
                  const displayNameEn = `${trainer.firstName.en} ${trainer.lastName.en}`.trim()

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
                        <Badge variant={trainer.isFreelancer ? "default" : "secondary"}>
                          {trainer.isFreelancer ? "ฟรีแลนซ์" : "พนักงาน"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {trainer.isFreelancer ? <Badge variant="outline">อิสระ</Badge> : getGymName(trainer.assignedGym)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={trainer.status === "active" ? "default" : "secondary"}>
                          {trainer.status === "active" ? "เปิดใช้งาน" : "ปิดการใช้งาน"}
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
                                {editingTrainer && (
                                  <TrainerForm
                                    trainer={editingTrainer}
                                    onSubmit={handleEditTrainer}
                                    onCancel={() => setEditingTrainer(null)}
                                  />
                                )}
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
                                  การดำเนินการนี้ไม่สามารถยกเลิกได้
                                  การดำเนินการนี้จะลบครูมวยและข้อมูลของพวกเขาออกจากเซิร์ฟเวอร์ของเราอย่างถาวร
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTrainer(trainer.id)}>
                                  ลบ
                                </AlertDialogAction>
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
        <SuccessToast message={toastMessage} isVisible={toastVisible} onClose={hideToast} />
      </AdminLayout>
    </ProtectedRoute>
  )
}
