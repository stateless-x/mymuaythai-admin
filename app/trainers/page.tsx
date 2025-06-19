"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Plus, Search, Edit, Trash2, Loader2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { toast } from "sonner"
import type { Trainer, Gym, Province, Tag } from "@/lib/types"
import { trainersApi, gymsApi, provincesApi } from "@/lib/api"
import { truncateId, formatPhoneDisplay, trimFormData } from "@/lib/utils/form-helpers"
import { useDebounce } from "@/hooks/use-debounce"
import { Switch } from "@/components/ui/switch"
import { tagService } from "@/lib/tagService"

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
  
  // Add a refresh trigger to force re-fetching
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

  // Single useEffect to handle all data fetching
  useEffect(() => {
    const fetchData = async () => {
      if (!sortField || !sortBy) {
        return;
      }
      try {
        // Show search loading only if we're searching, not on initial load
        if (debouncedSearchTerm) {
          setIsSearching(true)
        } else {
          setIsLoading(true)
        }
        
        // Use correct parameter names for trainers API
        const trainersParams = {
          page: pagination.page,
          pageSize: pagination.pageSize,
          searchTerm: debouncedSearchTerm || undefined,
          includeInactive: includeInactive,
          includeClasses: true, // Always include classes to show private classes for freelancers
          includeTags: true, // Always include tags to display trainer specializations
          isFreelance: freelancerFilter === 'all' ? undefined : freelancerFilter === 'freelancer',
          sortField: sortField,
          sortBy: sortBy,
        }
        
        const [trainersResponse, gymsResponse, provincesResponse] = await Promise.all([
          trainersApi.getAll(trainersParams),
          gymsApi.getAll({ pageSize: 100, includeInactive: true }),
          provincesApi.getAll()
        ])
        
        // Remove client-side filtering - let backend handle everything
        const trainersData = trainersResponse.data?.items || [];
        setTrainers(trainersData);
        
        // Use the pagination from response, but ensure it makes sense
        const totalFromResponse = trainersResponse.data?.total || trainersData.length;
        const pageSizeFromResponse = trainersResponse.data?.pageSize || pagination.pageSize;
        const totalPages = Math.ceil(totalFromResponse / pageSizeFromResponse);
        
        // If current page exceeds available pages, go to the last available page
        const validPage = pagination.page > totalPages ? Math.max(1, totalPages) : pagination.page;
        
        setPagination(prev => ({ 
          ...prev, 
          page: validPage,
          total: totalFromResponse,
          pageSize: pageSizeFromResponse
        }));
        
        // If we had to adjust the page, refetch with the correct page
        if (validPage !== pagination.page && totalPages > 0) {
          // Don't create infinite loop - only refetch if we haven't already adjusted
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

  // Reset to page 1 when search term or filters change
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
    // Force a re-fetch by incrementing the refresh trigger
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const closeEditDialog = () => {
    setEditingTrainer(null)
    // Refresh data to ensure we have the latest state after any edits
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
    // Transform tags: if they are tag objects, extract slugs; if they are already slugs, use as-is
    let tagSlugs: string[] = [];
    if (trainer.tags && Array.isArray(trainer.tags)) {
      tagSlugs = trainer.tags.map((tag: any) => {
        // If tag is an object with slug property, extract the slug
        if (typeof tag === 'object' && tag.slug) {
          return tag.slug;
        }
        // If tag is already a string (slug), use as-is
        if (typeof tag === 'string') {
          return tag;
        }
        // Fallback: should not happen but handle gracefully
        return '';
      }).filter(slug => slug !== ''); // Remove empty slugs
    }
    
    return {
      id: trainer.id,
      firstName: { th: trainer.first_name_th || "", en: trainer.first_name_en || "" },
      lastName: { th: trainer.last_name_th || "", en: trainer.last_name_en || "" },
      email: trainer.email || "",
      phone: trainer.phone || "",
      status: trainer.is_active ? "active" : "inactive",
      province_id: trainer.province?.id || null,
      tags: tagSlugs, // Use extracted tag slugs
      isFreelancer: trainer.is_freelance,
      bio: { th: trainer.bio_th || "", en: trainer.bio_en || "" },
      lineId: trainer.line_id || "",
      yearsOfExperience: trainer.exp_year || 0,
      privateClasses: transformBackendClassesToPrivateClasses(trainer.classes || [])
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
  const transformFormDataToApi = async (formData: TrainerFormData) => {
    try {
      // Convert tag slugs to tag objects for backend submission
      const tagObjects = await convertTagSlugsToTagObjects(formData.tags || []);
      
      console.log("DEBUG - Tag conversion for trainer:");
      console.log("- formData.tags (slugs):", formData.tags);
      console.log("- tagObjects:", tagObjects);
      
      // Note: No gym_id is sent from here. Assignment is handled in the Gym management section.
      return {
        first_name_th: formData.firstName.th,
        first_name_en: formData.firstName.en,
        last_name_th: formData.lastName.th,
        last_name_en: formData.lastName.en,
        email: formData.email,
        phone: formData.phone, // Already cleaned in the form component
        is_active: formData.status === "active",
        province_id: formData.province_id,
        tags: tagObjects, // Use tag objects instead of creating them from names
        is_freelance: formData.isFreelancer,
        bio_th: formData.bio.th,
        bio_en: formData.bio.en,
        line_id: formData.lineId,
        exp_year: formData.yearsOfExperience,
        // `classes` needs to be transformed for the API
        classes: (formData.privateClasses || []).map(cls => ({
          name: { th: cls.name.th, en: cls.name.en },
          description: { th: cls.description.th, en: cls.description.en },
          duration: cls.duration,
          price: cls.price,
          maxStudents: cls.maxStudents,
          isPrivateClass: true,
          isActive: cls.isActive
        }))
      }
    } catch (error) {
      console.error('Error converting tags for trainer submission:', error);
      throw error;
    }
  }

  const toggleCreatedSort = () => {
    if (sortField === "created_at") {
      setSortBy(sortBy === "desc" ? "asc" : "desc")
    } else {
      setSortField("created_at")
      setSortBy("desc")
    }
  }

  const toggleUpdatedSort = () => {
    if (sortField === "updated_at") {
      setSortBy(sortBy === "desc" ? "asc" : "desc")
    } else {
      setSortField("updated_at")
      setSortBy("desc")
    }
  }

  const handleAddTrainer = async (formData: TrainerFormData) => {
    try {
      const trimmedData = trimFormData(formData)
      const apiData = await transformFormDataToApi(trimmedData)
      await trainersApi.create(apiData)
      toast.success("สร้างครูมวยสำเร็จ")
      setIsAddDialogOpen(false)
      refreshData()
    } catch (err) {
      console.error("Error creating trainer:", err)
      toast.error(err instanceof Error ? err.message : "ไม่สามารถสร้างครูมวยได้")
    }
  }

  const handleEditTrainer = async (formData: TrainerFormData) => {
    if (!editingTrainer) return

    try {
      const trimmedData = trimFormData(formData)
      const apiData = await transformFormDataToApi(trimmedData)
      await trainersApi.update(editingTrainer.id, apiData)
      toast.success("อัพเดทครูมวยสำเร็จ")
      setEditingTrainer(null)
      refreshData()
    } catch (err) {
      console.error("Error updating trainer:", err)
      toast.error(err instanceof Error ? err.message : "ไม่สามารถอัพเดทครูมวยได้")
    }
  }

  const handleDeleteTrainer = async (trainerId: string) => {
    try {
      await trainersApi.delete(trainerId)
      
      // Simple optimistic update: Always remove from current view
      setTrainers(prev => prev.filter(trainer => trainer.id !== trainerId))
      setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      
      toast.success("ลบครูมวยสำเร็จ")
    } catch (err) {
      toast.error("ไม่สามารถลบครูมวยได้")
      // On error, refresh to get correct state
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
                    <TrainerForm 
                      onSubmit={handleAddTrainer} 
                      provinces={provinces}
                      onCancel={() => setIsAddDialogOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

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
                                  <TrainerForm 
                                    key={`form-${trainer.id}`}
                                    trainer={editingTrainer} 
                                    provinces={provinces}
                                    onSubmit={handleEditTrainer}
                                    onCancel={() => setEditingTrainer(null)}
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

  // Always show pagination if there are more than pageSize items, regardless of what backend says
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

// Helper function to convert tag slugs to tag objects with IDs
const convertTagSlugsToTagObjects = async (tagSlugs: string[]): Promise<Tag[]> => {
  if (!tagSlugs || tagSlugs.length === 0) {
    return [];
  }
  
  try {
    // Get tag objects from slugs
    const tagPromises = tagSlugs.map(async (slug) => {
      try {
        const response = await tagService.getTagBySlug(slug);
        return response.data;
      } catch (err) {
        console.error(`Failed to get tag with slug: ${slug}`, err);
        return null;
      }
    });
    
    const tags = await Promise.all(tagPromises);
    return tags.filter((tag): tag is Tag => tag !== null);
  } catch (error) {
    console.error('Error converting tag slugs to objects:', error);
    return [];
  }
}; 