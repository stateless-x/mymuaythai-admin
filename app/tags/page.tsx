"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, Trash2, Loader2, Hash, Tag as TagIcon, Users, Building, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { toast } from "sonner"
import type { Tag } from "@/lib/types"
import { tagsApi } from "@/lib/api"
import { useDebounce } from "@/hooks/use-debounce"

interface TagFormData {
  name_th: string
  name_en: string
}

// Pagination controls component
function PaginationControls({ page, total, pageSize, onPageChange }: { 
  page: number, 
  total: number, 
  pageSize: number, 
  onPageChange: (page: number) => void 
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

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
          disabled={page === 1 || total === 0}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || total === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || total === 0}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || total === 0}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Move TagForm component outside to prevent re-creation on each render
const TagForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  editingTag 
}: {
  formData: TagFormData
  setFormData: (data: TagFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  editingTag: Tag | null
}) => (
  <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
    <div className="space-y-2">
      <Label htmlFor="name-th">ชื่อแท็ก (ไทย) *</Label>
      <Input
        id="name-th"
        name="name-th"
        value={formData.name_th}
        onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
        placeholder="เช่น มวยเข่า"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        required
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="name-en">ชื่อแท็ก (อังกฤษ) *</Label>
      <Input
        id="name-en"
        name="name-en"
        value={formData.name_en}
        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
        placeholder="e.g. Muay Khao"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        required
      />
    </div>

    <div className="flex justify-end space-x-2">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
      >
        ยกเลิก
      </Button>
      <Button type="submit">
        {editingTag ? "อัพเดท" : "เพิ่มแท็ก"}
      </Button>
    </div>
  </form>
)

export default function TagsPage() {
  const [tags, setTags] = useState<(Tag & { gymCount: number, trainerCount: number })[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  })

  // Form state
  const [formData, setFormData] = useState<TagFormData>({
    name_th: "",
    name_en: ""
  })

  const fetchTags = async () => {
    // Show search loading only if we're searching, not on initial load
    if (debouncedSearchTerm) {
      setIsSearching(true)
    } else {
      setIsLoading(true)
    }
    
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        // Let backend use its defaults (updated_at desc)
      }
      
      const response = await tagsApi.getAll(params);
      
      // Handle response data structure
      const tagsData = response.data?.items || response.data || response;
      setTags(tagsData);
      
      // Use the pagination from response
      const totalFromResponse = response.data?.total || 0;
      const pageSizeFromResponse = response.data?.pageSize || pagination.pageSize;
      const totalPages = Math.ceil(totalFromResponse / pageSizeFromResponse);
      
      // If current page exceeds available pages, go to the last available page
      const validPage = pagination.page > totalPages ? Math.max(1, totalPages) : pagination.page;
      
      setPagination(prev => ({ 
        ...prev, 
        page: validPage,
        total: totalFromResponse,
        pageSize: pageSizeFromResponse
      }));
      
      setError(null)
    } catch (err) {
      console.error('Error fetching tags:', err)
      setError("Failed to fetch tags")
      toast.error("ไม่สามารถโหลดข้อมูลแท็กได้")
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [pagination.page, pagination.pageSize, debouncedSearchTerm])

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [debouncedSearchTerm])

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(p => ({ ...p, page: newPage }));
  }, []);

  const resetForm = () => {
    setFormData({
      name_th: "",
      name_en: ""
    })
  }

  const handleOpenAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (tag: Tag) => {
    setFormData({
      name_th: tag.name_th,
      name_en: tag.name_en
    })
    setEditingTag(tag)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name_th.trim()) {
      toast.error("กรุณากรอกชื่อแท็กภาษาไทย")
      return
    }
    
    if (!formData.name_en.trim()) {
      toast.error("กรุณากรอกชื่อแท็กภาษาอังกฤษ")
      return
    }

    try {
      if (editingTag) {
        const response = await tagsApi.update(editingTag.id, formData)
        const updatedTag = response.data
        if (updatedTag) {
          setTags(tags.map((tag) => (tag.id === editingTag.id ? { ...tag, ...updatedTag } : tag)))
        }
        setEditingTag(null)
        toast.success("แก้ไขแท็กสำเร็จ")
      } else {
        await tagsApi.create(formData)
        setIsAddDialogOpen(false)
        toast.success("เพิ่มแท็กสำเร็จ")
      }
      resetForm();
      fetchTags();
    } catch (err) {
      console.error("Error saving tag:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      toast.error(editingTag ? `ไม่สามารถแก้ไขแท็กได้: ${errorMessage}` : `ไม่สามารถเพิ่มแท็กได้: ${errorMessage}`)
    }
  }

  const handleDeleteTag = async (tagId: number) => {
    try {
      await tagsApi.delete(tagId)
      toast.success("ลบแท็กสำเร็จ")
      fetchTags();
    } catch (err) {
      console.error("Error deleting tag:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      toast.error(`ไม่สามารถลบแท็กได้: ${errorMessage}`)
    }
  }

  const closeEditDialog = () => {
    setEditingTag(null)
    resetForm()
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">จัดการแท็ก</h1>
              <p className="text-muted-foreground mt-1">
                จัดการแท็กสำหรับค้นหาและจัดหมวดหมู่ยิม และครูมวย
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มแท็กใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>เพิ่มแท็กใหม่</DialogTitle>
                </DialogHeader>
                <TagForm 
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleSubmit}
                  onCancel={() => setIsAddDialogOpen(false)}
                  editingTag={editingTag}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hash className="mr-2 h-5 w-5" />
                รายการแท็ก ({pagination.total})
              </CardTitle>
              <CardDescription>
                แท็กที่ใช้สำหรับจัดหมวดหมู่และค้นหายิมและครูมวย
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาแท็ก..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm pl-8"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>เกิดข้อผิดพลาด: {error}</p>
                </div>
              ) : tags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TagIcon className="mx-auto h-12 w-12 mb-4" />
                  <p>ไม่พบแท็กที่ค้นหา</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ชื่อไทย</TableHead>
                        <TableHead>ชื่ออังกฤษ</TableHead>
                        <TableHead className="text-center">ยิม</TableHead>
                        <TableHead className="text-center">ครูมวย</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tags.map((tag) => (
                        <TableRow key={tag.id}>
                          <TableCell className="font-medium">{tag.name_th}</TableCell>
                          <TableCell>{tag.name_en}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <Building className="h-3 w-3" />
                              <span>{tag.gymCount || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{tag.trainerCount || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Dialog open={editingTag?.id === tag.id} onOpenChange={(open) => !open && closeEditDialog()}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEditDialog(tag)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                  <DialogHeader>
                                    <DialogTitle>แก้ไขแท็ก</DialogTitle>
                                  </DialogHeader>
                                  <TagForm 
                                    formData={formData}
                                    setFormData={setFormData}
                                    onSubmit={handleSubmit}
                                    onCancel={closeEditDialog}
                                    editingTag={editingTag}
                                  />
                                </DialogContent>
                              </Dialog>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      คุณแน่ใจหรือไม่ที่จะลบแท็ก "{tag.name_th}" ({tag.name_en})?
                                      การกระทำนี้ไม่สามารถยกเลิกได้
                                      {(tag.gymCount || 0) > 0 || (tag.trainerCount || 0) > 0 ? (
                                        <span className="block mt-2 font-medium text-red-600">
                                          แท็กนี้ถูกใช้งานโดย {tag.gymCount || 0} ยิม และ {tag.trainerCount || 0} ครูมวย
                                        </span>
                                      ) : null}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTag(tag.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      ลบแท็ก
                                    </AlertDialogAction>
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
              )}

              <PaginationControls
                page={pagination.page}
                total={pagination.total}
                pageSize={pagination.pageSize}
                onPageChange={handlePageChange}
              />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
} 