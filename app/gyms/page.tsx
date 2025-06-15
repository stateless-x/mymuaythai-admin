"use client"

import { useState, useEffect, useCallback } from "react"
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
import type { Gym } from "@/lib/types"
import { gymsApi } from "@/lib/api"
import { truncateId, formatPhoneDisplay } from "@/lib/utils/form-helpers"
import { useDebounce } from "@/hooks/use-debounce"

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

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [sortField, setSortField] = useState<"created_at" | "updated_at">("created_at")
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingGym, setEditingGym] = useState<Gym | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  })

  // Single useEffect to handle all data fetching
  useEffect(() => {
    const fetchData = async () => {
      // Show search loading only if we're searching, not on initial load
      if (debouncedSearchTerm) {
        setIsSearching(true)
      } else {
        setIsLoading(true)
      }
      
      try {
        const params = {
          page: pagination.page, // Use the current page as-is
          pageSize: pagination.pageSize,
          searchTerm: debouncedSearchTerm,
          is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
          sortField: sortField,
          sortBy: sortBy === 'newest' ? 'desc' : 'asc',
        }
        
        const response = await gymsApi.getAll(params);
        
        let filteredGyms = response.data || [];
        
        // Client-side filtering as fallback if backend search doesn't work properly
        if (debouncedSearchTerm) {
          const searchLower = debouncedSearchTerm.toLowerCase();
          filteredGyms = filteredGyms.filter((gym: Gym) => 
            gym.name_th?.toLowerCase().includes(searchLower) ||
            gym.name_en?.toLowerCase().includes(searchLower) ||
            gym.email?.toLowerCase().includes(searchLower) ||
            gym.phone?.includes(debouncedSearchTerm) ||
            gym.province?.name_th?.toLowerCase().includes(searchLower) ||
            gym.province?.name_en?.toLowerCase().includes(searchLower)
          );
        }
        
        // Status filtering as fallback
        if (statusFilter !== 'all') {
          filteredGyms = filteredGyms.filter((gym: Gym) => 
            statusFilter === 'active' ? gym.is_active : !gym.is_active
          );
        }
        
        setGyms(filteredGyms);
        
        // Use the pagination from response, but ensure it makes sense
        const totalFromResponse = response.pagination?.total || filteredGyms.length;
        const pageSizeFromResponse = response.pagination?.pageSize || pagination.pageSize;
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
        
        setError(null)
      } catch (err) {
        setError("Failed to fetch gyms")
        toast.error("ไม่สามารถโหลดข้อมูลยิมได้")
      } finally {
        setIsLoading(false)
        setIsSearching(false)
      }
    }

    fetchData()
  }, [pagination.page, pagination.pageSize, debouncedSearchTerm, statusFilter, sortField, sortBy])

  // Only reset to page 1 when search term or filters change (not when just navigating pages)
  const [previousSearchTerm, setPreviousSearchTerm] = useState("")
  const [previousStatusFilter, setPreviousStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [previousSortField, setPreviousSortField] = useState<"created_at" | "updated_at">("created_at")
  const [previousSortBy, setPreviousSortBy] = useState<"newest" | "oldest">("newest")

  useEffect(() => {
    // Check if search criteria actually changed
    const searchChanged = debouncedSearchTerm !== previousSearchTerm
    const statusChanged = statusFilter !== previousStatusFilter
    const sortFieldChanged = sortField !== previousSortField
    const sortByChanged = sortBy !== previousSortBy

    if (searchChanged || statusChanged || sortFieldChanged || sortByChanged) {
      // Only reset to page 1 if we're not already on page 1
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }))
      }
      
      // Update previous values
      setPreviousSearchTerm(debouncedSearchTerm)
      setPreviousStatusFilter(statusFilter)
      setPreviousSortField(sortField)
      setPreviousSortBy(sortBy)
    }
  }, [debouncedSearchTerm, statusFilter, sortField, sortBy, previousSearchTerm, previousStatusFilter, previousSortField, previousSortBy, pagination.page])

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(p => ({ ...p, page: newPage }));
  }, []);

  const handleFilterChange = useCallback(<T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (value: T) => {
    setter(value);
  }, []);

  const refreshData = useCallback(() => {
    // Force a re-fetch by updating a dependency
    setPagination(prev => ({ ...prev }));
  }, []);

  const closeEditDialog = () => {
    setEditingGym(null)
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

  const handleAddGym = async (gymData: Omit<Gym, "id" | "joinedDate">) => {
    try {
      await gymsApi.create(gymData);
      setIsAddDialogOpen(false);
      toast.success("เพิ่มยิมสำเร็จ");
      refreshData();
    } catch (err) {
      toast.error("ไม่สามารถเพิ่มยิมได้");
    }
  };

  const savePartialGymData = async (gymData: Omit<Gym, "id" | "joinedDate">) => {
    if (editingGym) {
      try {
        const updatedGym = await gymsApi.update(editingGym.id, gymData)
        return updatedGym
      } catch (err) {
        throw err 
      }
    }
  }

  const handleEditComplete = () => {
    setEditingGym(null)
    refreshData()
  }

  const handlePartialSaveSuccess = () => {
    refreshData()
  }

  const handleDeleteGym = async (gymId: string) => {
    try {
      await gymsApi.delete(gymId)
      refreshData()
      toast.success("ลบยิมสำเร็จ")
    } catch (err) {
      toast.error("ไม่สามารถลบยิมได้")
    }
  }

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

  if (isLoading && gyms.length === 0) {
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
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">จัดการยิมบนแพลตฟอร์ม</h1>
                  {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-muted-foreground">คุณสามารถดู แก้ไข หรือเพิ่มยิมใหม่ รวมถึงจัดการรายละเอียดที่ใช้แสดงผลบนแพลตฟอร์ม</p>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open)
                if (open) {
                  setEditingGym(null)
                }
              }}>
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
                    <GymForm 
                      onSubmit={handleAddGym} 
                      onCancel={() => {
                        setIsAddDialogOpen(false)
                        setEditingGym(null)
                      }}
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
                  placeholder="ค้นหายิม..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-8 ${isSearching ? 'pr-8' : ''}`}
                />
              </div>
              <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
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
                    <TableHead>รหัสยิม</TableHead>
                    <TableHead>ชื่อสถานที่
                    </TableHead>
                    <TableHead>เบอร์โทร</TableHead>
                    <TableHead>จังหวัด</TableHead>
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
                    <TableHead>สถานะการแสดงผล
                    </TableHead>
                    <TableHead className="text-right">จัดการข้อมูล
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && gyms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : gyms.map((gym, index) => (
                    <TableRow key={gym.id || `gym-${index}`}>
                      <TableCell className="font-mono text-sm">{truncateId(gym.id)}</TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{gym.name_th}</div>
                          {gym.name_en && (
                            <div className="text-sm text-muted-foreground">{gym.name_en}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatPhoneDisplay(gym.phone || "")}</TableCell>
                      <TableCell>{gym.province?.name_th || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <Tooltip>
                          <TooltipTrigger>
                            {formatDate(gym.created_at)}
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatAbsoluteDate(gym.created_at)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <Tooltip>
                          <TooltipTrigger>
                            {gym.updated_at ? formatDate(gym.updated_at) : "-"}
                          </TooltipTrigger>
                          <TooltipContent>
                            {gym.updated_at ? formatAbsoluteDate(gym.updated_at) : "-"}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
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
                            key={`edit-dialog-${gym.id}`}
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
                                  gym={editingGym || undefined} 
                                  onCancel={() => closeEditDialog()}
                                  onSavePartial={savePartialGymData}
                                  onComplete={handleEditComplete}
                                  onSavePartialSuccess={handlePartialSaveSuccess}
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

            {gyms.length === 0 && !isLoading && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">ไม่พบยิม</p>
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