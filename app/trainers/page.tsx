"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { TrainerFormMultiStep } from "@/components/trainer-form-multi-step"
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
import { Plus, Search, Edit, Trash2, Loader2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { toast } from "sonner"
import type { Trainer, Gym, Province, Tag } from "@/lib/types"
import { trainersApi, gymsApi, provincesApi } from "@/lib/api"
import { truncateId, formatPhoneDisplay, trimFormData } from "@/lib/utils/form-helpers"
import { useDebounce } from "@/hooks/use-debounce"
import { Switch } from "@/components/ui/switch"
import { tagsApi } from "@/lib/api"

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [gyms, setGyms] = useState<Gym[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [includeInactive, setIncludeInactive] = useState(true)
  const [freelancerFilter, setFreelancerFilter] = useState<"all" | "freelancer" | "staff">("all")
  const [sortField, setSortField] = useState<"created_at" | "updated_at">()
  const [sortBy, setSortBy] = useState<"desc" | "asc">()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  })

  useEffect(() => {
    setSortField("updated_at")
    setSortBy("desc")
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!sortField || !sortBy) {
        return;
      }
      try {
        if (debouncedSearchTerm) {
          setIsSearching(true)
        } else {
          setIsLoading(true)
        }
        
        const trainersParams = {
          page: pagination.page,
          pageSize: pagination.pageSize,
          searchTerm: debouncedSearchTerm || undefined,
          includeInactive: includeInactive,
          includeClasses: true,
          includeTags: true,
          isFreelance: freelancerFilter === 'all' ? undefined : freelancerFilter === 'freelancer',
          sortField: sortField,
          sortBy: sortBy,
        }
        
        const [trainersResponse, gymsResponse, provincesResponse] = await Promise.all([
          trainersApi.getAll(trainersParams),
          gymsApi.getAll({ pageSize: 100, includeInactive: true }),
          provincesApi.getAll()
        ])
        
        const trainersData = trainersResponse.data?.items || [];
        setTrainers(trainersData);
        
        const totalFromResponse = trainersResponse.data?.total || trainersData.length;
        const pageSizeFromResponse = trainersResponse.data?.pageSize || pagination.pageSize;
        const totalPages = Math.ceil(totalFromResponse / pageSizeFromResponse);
        
        const validPage = pagination.page > totalPages ? Math.max(1, totalPages) : pagination.page;
        
        setPagination(prev => ({ 
          ...prev, 
          page: validPage,
          total: totalFromResponse,
          pageSize: pageSizeFromResponse
        }));
        
        if (validPage !== pagination.page && totalPages > 0) {
          return;
        }
        
        setGyms(gymsResponse.data || []);
        setProvinces(provincesResponse.data || []);
        setError(null)
        
      } catch (err) {
        setError("Failed to fetch data")
        toast.error("ไม่สามารถโหลดข้อมูลครูมวยได้: " + (err instanceof Error ? err.message : "Unknown error"))
      } finally {
        setIsLoading(false)
        setIsSearching(false)
      }
    }

    fetchData()
  }, [pagination.page, pagination.pageSize, debouncedSearchTerm, includeInactive, freelancerFilter, sortField, sortBy, refreshTrigger])

  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [debouncedSearchTerm, includeInactive, freelancerFilter, sortField, sortBy])

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(p => ({ ...p, page: newPage }));
  }, []);

  const handleFilterChange = useCallback(<T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (value: T) => {
    setter(value);
  }, []);

  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const closeEditDialog = () => {
    setEditingTrainer(null)
    refreshData()
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

  const toggleCreatedSort = () => {
    if (sortField === "created_at" && sortBy === "desc") {
      setSortBy("asc")
    } else {
      setSortField("created_at")
      setSortBy("desc")
    }
  }

  const toggleUpdatedSort = () => {
    if (sortField === "updated_at" && sortBy === "desc") {
      setSortBy("asc")
    } else {
      setSortField("updated_at")
      setSortBy("desc")
    }
  }

  const handleAddTrainer = async (trainerData: Partial<Trainer>) => {
    try {
      await trainersApi.create(trainerData)
      toast.success("สร้างครูมวยสำเร็จ")
      setIsAddDialogOpen(false)
      refreshData()
    } catch (error) {
      console.error("Error creating trainer:", error)
      toast.error("ไม่สามารถสร้างครูมวยได้", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }
  
  const handleFinalUpdate = async (trainerData: Partial<Trainer>) => {
    if (!editingTrainer?.id) return
    try {
      await trainersApi.update(editingTrainer.id, trainerData)
      toast.success("อัปเดตข้อมูลครูมวยสำเร็จ")
      closeEditDialog()
    } catch (error) {
      console.error("Error updating trainer:", error)
      toast.error("ไม่สามารถอัปเดตข้อมูลครูมวยได้", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handlePartialUpdate = async (trainerData: Partial<Trainer>) => {
    if (!editingTrainer?.id) return
    try {
      const response = await trainersApi.update(editingTrainer.id, trainerData)
      setEditingTrainer(response.data)
      refreshData()
    } catch (error) {
      console.error("Error performing partial update:", error)
      toast.error("ไม่สามารถบันทึกข้อมูลชั่วคราวได้", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }

  const handleDeleteTrainer = async (trainerId: string) => {
    try {
      await trainersApi.delete(trainerId)
      setTrainers(prev => prev.filter(trainer => trainer.id !== trainerId))
      setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      toast.success("ลบครูมวยสำเร็จ")
    } catch (err) {
      toast.error("ไม่สามารถลบครูมวยได้")
      refreshData()
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
                    <TrainerFormMultiStep
                      onSubmit={handleAddTrainer}
                      onCancel={() => setIsAddDialogOpen(false)}
                      onSavePartial={async () => {}}
                      onComplete={() => {
                        setIsAddDialogOpen(false)
                        refreshData()
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  {isSearching && (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Input
                    placeholder="ค้นหาครูมวย..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-8 ${isSearching ? 'pr-8' : ''}`}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Select value={freelancerFilter} onValueChange={handleFilterChange(setFreelancerFilter)}>
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
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-inactive"
                  checked={includeInactive}
                  onCheckedChange={setIncludeInactive}
                />
                <label htmlFor="include-inactive" className="text-sm font-medium">
                  แสดงครูมวยที่ปิดการใช้งาน
                </label>
              </div>
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
                          sortBy === "desc" ? (
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
                          sortBy === "desc" ? (
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
                  {trainers.map((trainer, index) => {
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
                              key={trainer.id}
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
                                  {editingTrainer && (
                                    <TrainerFormMultiStep
                                      trainer={editingTrainer ?? undefined}
                                      onSubmit={handleFinalUpdate}
                                      onCancel={closeEditDialog}
                                      onSavePartial={handlePartialUpdate}
                                      onComplete={closeEditDialog}
                                      fetchTrainerData={refreshData}
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
                                    การดำเนินการนี้ไม่สามารถยกเลิกได้ การดำเนินการนี้จะลบข้อมูลครูมวยออกจากเซิร์ฟเวอร์ของเราอย่างถาวร
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

            {trainers.length === 0 && !isLoading && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">ไม่พบครูมวย</p>
              </div>
            )}

            <PaginationControls
              page={pagination.page}
              total={pagination.total}
              pageSize={pagination.pageSize}
              onPageChange={handlePageChange}
            />

          </div>
        </TooltipProvider>
      </AdminLayout>
    </ProtectedRoute>
  )
}

function PaginationControls({ page, total, pageSize, onPageChange }: { page: number, total: number, pageSize: number, onPageChange: (page: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  const shouldShowPagination = total > pageSize || totalPages > 1
  if (!shouldShowPagination) {
    return null
  }

  return (
    <div className="flex items-center justify-between pt-4">
      <div className="text-sm text-muted-foreground">
        หน้า {page} จาก {totalPages} (ทั้งหมด {total} รายการ)
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
