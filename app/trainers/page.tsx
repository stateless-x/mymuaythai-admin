"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { TrainerForm, type TrainerFormData } from "@/components/trainer-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import type { Trainer } from "@/lib/types"
import { trainersApi, gymsApi } from "@/lib/api"
import { truncateId, formatPhoneDisplay } from "@/lib/utils/form-helpers"

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [gyms, setGyms] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [freelancerFilter, setFreelancerFilter] = useState<"all" | "freelancer" | "staff">("all")
  const [sortField, setSortField] = useState<"created_at" | "updated_at">("created_at")
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrainers = async () => {
    try {
      setIsLoading(true)
      
      const [trainersData, gymsData] = await Promise.all([
        trainersApi.getAll(),
        gymsApi.getAll()
      ])
      
      // Handle both direct array and nested data.items structure
      const trainersArray = trainersData.items || trainersData || []
      const gymsArray = gymsData.items || gymsData || []
      
      setTrainers(trainersArray)
      setGyms(gymsArray)
      setError(null)
      
    } catch (err) {
      setError("Failed to fetch data")
      toast.error("ไม่สามารถโหลดข้อมูลครูมวยได้: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrainers()
  }, [])

  const closeEditDialog = () => {
    setEditingTrainer(null)
  }

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    const diffInMonths = Math.floor(diffInDays / 30)
    const diffInYears = Math.floor(diffInDays / 365)

    // Show relative time for recent dates
    if (diffInSeconds < 60) {
      return "เมื่อสักครู่"
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} นาทีที่แล้ว`
    } else if (diffInHours < 24) {
      return `${diffInHours} ชั่วโมงที่แล้ว`
    } else if (diffInDays < 7) {
      return `${diffInDays} วันที่แล้ว`
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `${weeks} สัปดาห์ที่แล้ว`
    } else if (diffInMonths < 12) {
      return `${diffInMonths} เดือนที่แล้ว`
    } else {
      return `${diffInYears} ปีที่แล้ว`
    }
  }

  const formatAbsoluteDate = (dateString: string | Date) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Transform backend trainer data to form data structure
  const transformTrainerToFormData = (trainer: Trainer): TrainerFormData => {
    return {
      id: trainer.id,
      firstName: {
        th: trainer.first_name_th || "",
        en: trainer.first_name_en || "",
      },
      lastName: {
        th: trainer.last_name_th || "",
        en: trainer.last_name_en || "",
      },
      email: trainer.email || "",
      phone: trainer.phone || "",
      status: trainer.is_active ? "active" : "inactive",
      assignedGym: trainer.primaryGym?.id || "",
      tags: trainer.tags || [],
      isFreelancer: trainer.is_freelance || false,
      bio: {
        th: trainer.bio_th || "",
        en: trainer.bio_en || "",
      },
      lineId: trainer.line_id || "",
      yearsOfExperience: trainer.exp_year || 0,
      privateClasses: transformBackendClassesToPrivateClasses(trainer.classes || []),
      joinedDate: trainer.created_at,
    }
  }

  // Helper function to transform backend classes to frontend format
  function transformBackendClassesToPrivateClasses(backendClasses: any[]): any[] {
    if (!backendClasses || !Array.isArray(backendClasses)) {
      return []
    }

    return backendClasses
      .map(cls => ({
        id: cls.id || `temp-${Date.now()}-${Math.random()}`,
        name: {
          th: cls.name_th || "",
          en: cls.name_en || "",
        },
        description: {
          th: cls.description_th || "",
          en: cls.description_en || "",
        },
        duration: cls.duration_minutes || 60,
        price: cls.price ? Math.round(cls.price / 100) : 1000, // Convert from satang to baht
        currency: "THB",
        maxStudents: cls.max_students || 1,
        isActive: cls.is_active !== false,
        isPrivateClass: cls.is_private_class !== false, // Map backend is_private_class to frontend isPrivateClass
        createdDate: cls.created_at ? new Date(cls.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      }))
  }

  // Helper function to transform frontend PrivateClass back to backend format
  function transformPrivateClassesToBackend(privateClasses: any[]): any[] {
    if (!privateClasses || !Array.isArray(privateClasses)) {
      return []
    }

    return privateClasses.map(cls => ({
      name: {
        th: cls.name?.th || "",
        en: cls.name?.en || "",
      },
      description: {
        th: cls.description?.th || "",
        en: cls.description?.en || "",
      },
      duration: cls.duration || 60,
      maxStudents: cls.maxStudents || 1,
      price: cls.price || 1000, // Keep in baht as backend will convert to satang
      isActive: cls.isActive !== false,
      isPrivateClass: cls.isPrivateClass !== false, // Map frontend isPrivateClass to backend is_private_class
    }))
  }

  // Transform form data to backend API structure
  const transformFormDataToApi = (formData: TrainerFormData) => {
    // Validation: Non-freelance trainers must have a gym
    if (!formData.isFreelancer && !formData.assignedGym) {
      throw new Error("ครูมวยที่ไม่ใช่ฟรีแลนซ์ต้องมีการมอบหมายยิม")
    }

    const transformedClasses = transformPrivateClassesToBackend(formData.privateClasses || [])

    const apiData = {
      first_name_th: formData.firstName.th,
      first_name_en: formData.firstName.en,
      last_name_th: formData.lastName.th,
      last_name_en: formData.lastName.en,
      email: formData.email || "",
      phone: formData.phone,
      bio_th: formData.bio.th,
      bio_en: formData.bio.en,
      is_active: formData.status === "active",
      is_freelance: formData.isFreelancer,
      gym_id: formData.isFreelancer ? null : (formData.assignedGym || null),
      line_id: formData.lineId || "",
      exp_year: formData.yearsOfExperience || 0,
      tags: formData.tags,
      classes: transformedClasses,
    }
    
    return apiData
  }

  const filteredAndSortedTrainers = trainers
    .filter((trainer) => {
      // Search filter
      const fullNameTh = `${trainer.first_name_th} ${trainer.last_name_th}`.trim()
      const fullNameEn = `${trainer.first_name_en} ${trainer.last_name_en}`.trim()
      const searchMatch = fullNameTh.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fullNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email?.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const statusMatch = statusFilter === "all" || 
        (statusFilter === "active" && trainer.is_active) ||
        (statusFilter === "inactive" && !trainer.is_active)

      // Freelancer filter
      const freelancerMatch = freelancerFilter === "all" ||
        (freelancerFilter === "freelancer" && trainer.is_freelance) ||
        (freelancerFilter === "staff" && !trainer.is_freelance)

      return searchMatch && statusMatch && freelancerMatch
    })
    .sort((a, b) => {
      // Sort by selected field
      let dateA: number, dateB: number
      
      if (sortField === "updated_at") {
        dateA = new Date(a.updated_at || a.created_at || 0).getTime()
        dateB = new Date(b.updated_at || b.created_at || 0).getTime()
      } else {
        dateA = new Date(a.created_at || 0).getTime()
        dateB = new Date(b.created_at || 0).getTime()
      }
      
      return sortBy === "newest" ? dateB - dateA : dateA - dateB
    })

  const toggleCreatedSort = () => {
    if (sortField === "created_at") {
      setSortBy(sortBy === "newest" ? "oldest" : "newest")
    } else {
      setSortField("created_at")
      setSortBy("newest")
    }
  }

  const toggleUpdatedSort = () => {
    if (sortField === "updated_at") {
      setSortBy(sortBy === "newest" ? "oldest" : "newest")
    } else {
      setSortField("updated_at")
      setSortBy("newest")
    }
  }

  const handleAddTrainer = async (formData: TrainerFormData) => {
    try {
      const apiData = transformFormDataToApi(formData)
      const newTrainer = await trainersApi.create(apiData)
      
      setIsAddDialogOpen(false)
      setEditingTrainer(null)
      setTrainers(prev => [newTrainer, ...prev])
      toast.success("เพิ่มครูมวยสำเร็จ")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "ไม่สามารถเพิ่มครูมวยได้"
      toast.error(errorMessage)
    }
  }

  const handleEditTrainer = async (formData: TrainerFormData) => {
    if (editingTrainer) {
      try {
        const apiData = transformFormDataToApi(formData)
        await trainersApi.update(editingTrainer.id, apiData)
        fetchTrainers();
        setEditingTrainer(null)
        toast.success("แก้ไขครูมวยสำเร็จ")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "ไม่สามารถแก้ไขครูมวยได้"
        toast.error(errorMessage)
      }
    }
  }

  const handleSaveTrainer = async (trainerData: Omit<Trainer, "id" | "created_at">) => {
    if (editingTrainer) {
      try {
        const updatedTrainer = await trainersApi.update(editingTrainer.id, trainerData)
        setTrainers(prev => prev.map(trainer => trainer.id === editingTrainer.id ? updatedTrainer : trainer))
        return updatedTrainer
      } catch (err) {
        throw err 
      }
    }
  }

  const handleDeleteTrainer = async (trainerId: string) => {
    try {
      await trainersApi.delete(trainerId)
      setTrainers(trainers.filter((trainer) => trainer.id !== trainerId))
      toast.success("ลบครูมวยสำเร็จ")
    } catch (err) {
      toast.error("ไม่สามารถลบครูมวยได้")
    }
  }

  const getGymName = (trainer: Trainer) => {
    if (trainer.is_freelance) {
      return <Badge variant="outline">อิสระ</Badge>
    }
    
    if (!trainer.primaryGym) {
      return "-"
    }

    return trainer.primaryGym.name_th || trainer.primaryGym.name_en || "-"
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
        <TooltipProvider>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">จัดการครูมวยบนแพลตฟอร์ม</h1>
                <p className="text-muted-foreground">คุณสามารถดู แก้ไข หรือเพิ่มครูมวยใหม่ รวมถึงจัดการรายละเอียดที่ใช้แสดงผลบนแพลตฟอร์ม</p>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open)
                if (open) {
                  setEditingTrainer(null)
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />สร้างครูมวยใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl w-[98vw] max-h-[98vh] p-0 flex flex-col">
                  <div className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogHeader>
                      <DialogTitle>เพิ่มครูมวยใหม่</DialogTitle>
                    </DialogHeader>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <TrainerForm 
                      gyms={gyms}
                      onSubmit={handleAddTrainer} 
                      onCancel={() => {
                        setIsAddDialogOpen(false)
                        setEditingTrainer(null)
                      }} 
                    />
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
              <Select value={freelancerFilter} onValueChange={(value: "all" | "freelancer" | "staff") => setFreelancerFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="กรองตามประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ครูมวยทั้งหมด</SelectItem>
                  <SelectItem value="freelancer">ฟรีแลนซ์เท่านั้น</SelectItem>
                  <SelectItem value="staff">พนักงานเท่านั้น</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="กรองตามสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="active">เปิดใช้งาน</SelectItem>
                  <SelectItem value="inactive">ปิดการใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสครูมวย</TableHead>
                    <TableHead>ชื่อครูมวย</TableHead>
                    <TableHead>เบอร์โทร</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>ยิมที่มอบหมาย</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={toggleCreatedSort}
                        className="p-0 h-auto font-semibold hover:bg-transparent"
                      >
                        วันที่ลงทะเบียน
                        {sortField === "created_at" ? (
                          sortBy === "newest" ? (
                            <ArrowDown className="ml-1 h-4 w-4" />
                          ) : (
                            <ArrowUp className="ml-1 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-1 h-4 w-4 opacity-30" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={toggleUpdatedSort}
                        className="p-0 h-auto font-semibold hover:bg-transparent"
                      >
                        อัปเดตล่าสุด
                        {sortField === "updated_at" ? (
                          sortBy === "newest" ? (
                            <ArrowDown className="ml-1 h-4 w-4" />
                          ) : (
                            <ArrowUp className="ml-1 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-1 h-4 w-4 opacity-30" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>สถานะการแสดงผล</TableHead>
                    <TableHead className="text-right">จัดการข้อมูล</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTrainers.map((trainer, index) => {
                    const displayNameTh = `${trainer.first_name_th} ${trainer.last_name_th}`.trim()
                    const displayNameEn = `${trainer.first_name_en} ${trainer.last_name_en}`.trim()

                    return (
                      <TableRow key={trainer.id || `trainer-${index}`}>
                        <TableCell className="font-mono text-sm">{truncateId(trainer.id)}</TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{displayNameTh}</div>
                            {displayNameEn && <div className="text-sm text-muted-foreground">{displayNameEn}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{formatPhoneDisplay(trainer.phone || "")}</TableCell>
                        <TableCell>
                          <Badge variant={trainer.is_freelance ? "default" : "secondary"}>
                            {trainer.is_freelance ? "ฟรีแลนซ์" : "พนักงาน"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getGymName(trainer)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <Tooltip>
                            <TooltipTrigger>
                              {formatDate(trainer.created_at)}
                            </TooltipTrigger>
                            <TooltipContent>
                              {formatAbsoluteDate(trainer.created_at)}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <Tooltip>
                            <TooltipTrigger>
                              {trainer.updated_at ? formatDate(trainer.updated_at) : "-"}
                            </TooltipTrigger>
                            <TooltipContent>
                              {trainer.updated_at ? formatAbsoluteDate(trainer.updated_at) : "-"}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`pointer-events-none ${trainer.is_active ? "bg-green-500" : "bg-gray-100"}`}
                            variant={trainer.is_active ? "default" : "secondary"}>
                            {trainer.is_active ? "เปิดใช้งาน" : "ปิดการใช้งาน"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Dialog 
                              key={`edit-dialog-${trainer.id}`}
                              open={editingTrainer?.id === trainer.id} 
                              onOpenChange={(open) => {
                                if (!open) {
                                  closeEditDialog()
                                }
                              }}
                              modal={true}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => {
                                  setEditingTrainer(trainer)
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
                                    <DialogTitle>แก้ไขครูมวย</DialogTitle>
                                  </DialogHeader>
                                </div>
                                <div className="flex-1 overflow-y-auto px-6 pb-6">
                                  <TrainerForm 
                                    trainer={transformTrainerToFormData(trainer) as any}
                                    gyms={gyms}
                                    onSubmit={handleEditTrainer} 
                                    onCancel={() => closeEditDialog()}
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

            {filteredAndSortedTrainers.length === 0 && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">ไม่พบครูมวย</p>
              </div>
            )}
          </div>
        </TooltipProvider>
      </AdminLayout>
    </ProtectedRoute>
  )
} 