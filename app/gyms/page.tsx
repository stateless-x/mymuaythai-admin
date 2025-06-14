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
import type { Gym } from "@/lib/types"
import { gymsApi } from "@/lib/api"
import { truncateId, formatPhoneDisplay } from "@/lib/utils/form-helpers"

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [sortField, setSortField] = useState<"created_at" | "updated_at">("created_at")
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingGym, setEditingGym] = useState<Gym | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefetching, setIsRefetching] = useState(false)

  const fetchGyms = async (isInitial = false) => {
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      if (isInitial) {
        setIsLoading(true)
      } else {
        setIsRefetching(true)
      }
      
      // For refetches, start a timer and the API call simultaneously.
      const fetchPromise = gymsApi.getAll();
      const delayPromise = isInitial ? Promise.resolve() : delay(1000); // 1-second minimum display time

      // Wait for both to complete before proceeding.
      const [data] = await Promise.all([fetchPromise, delayPromise]);

      setGyms(data)
      setError(null)
    } catch (err) {
      setError("Failed to fetch gyms")
      toast.error("ไม่สามารถโหลดข้อมูลยิมได้")
    } finally {
      if (isInitial) {
        setIsLoading(false)
      } else {
        setIsRefetching(false)
      }
    }
  }

  useEffect(() => {
    fetchGyms(true)
  }, [])

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

  const filteredAndSortedGyms = gyms
    .filter((gym) => {
      // Search filter
      const gymName = `${gym.name_th} ${gym.name_en}`.trim()
      const gymLocation = gym.province ? `${gym.province.name_th} ${gym.province.name_en}`.trim() : ""
      const searchMatch = gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gymLocation.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const statusMatch = statusFilter === "all" || 
        (statusFilter === "active" && gym.is_active) ||
        (statusFilter === "inactive" && !gym.is_active)

      return searchMatch && statusMatch
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

  const handleAddGym = async (gymData: Omit<Gym, "id" | "joinedDate">) => {
    try {
      await gymsApi.create(gymData);
      setIsAddDialogOpen(false); // Close the dialog immediately
      toast.success("เพิ่มยิมสำเร็จ");

      // Refresh the list after a short delay to allow the dialog to close.
      setTimeout(() => {
        fetchGyms();
      }, 100);

    } catch (err) {
      toast.error("ไม่สามารถเพิ่มยิมได้");
    }
  };

  const savePartialGymData = async (gymData: Omit<Gym, "id" | "joinedDate">) => {
    if (editingGym) {
      try {
        // Only perform the API update. Do not update state here to prevent re-renders.
        const updatedGym = await gymsApi.update(editingGym.id, gymData)
        // The success handler will be responsible for fetching new data.
        return updatedGym
      } catch (err) {
        throw err 
      }
    }
  }

  // Special success handler for edit mode that closes dialog and refreshes
  const handleEditComplete = () => {
    setEditingGym(null) // Close the dialog first
    // Delay the data refresh to ensure dialog closes completely
    setTimeout(() => {
      fetchGyms() // Then refresh the data after dialog is closed
    }, 100)
  }

  // Success handler for step 1 saves - only refresh data, don't close dialog
  const handlePartialSaveSuccess = () => {
    fetchGyms() // Refresh the data but keep dialog open
  }

  const handleDeleteGym = async (gymId: string) => {
    try {
      await gymsApi.delete(gymId)
      setGyms(gyms.filter((gym) => gym.id !== gymId))
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
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">จัดการยิมบนแพลตฟอร์ม</h1>
                  {isRefetching && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
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
                <Input
                  placeholder="ค้นหายิม..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
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
                  {filteredAndSortedGyms.map((gym, index) => (
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

            {filteredAndSortedGyms.length === 0 && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">ไม่พบยิม</p>
              </div>
            )}
          </div>
        </TooltipProvider>
      </AdminLayout>
    </ProtectedRoute>
  )
} 