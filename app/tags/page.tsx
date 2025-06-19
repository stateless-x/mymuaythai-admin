"use client"

import { useState, useEffect } from "react"
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
import { Plus, Search, Edit, Trash2, Loader2, Hash, Tag as TagIcon, Users, Building } from "lucide-react"
import { toast } from "sonner"
import type { Tag } from "@/lib/types"
import { tagService } from "@/lib/tagService"

interface TagFormData {
  name_th: string
  name_en: string
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [filteredTags, setFilteredTags] = useState<Tag[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<TagFormData>({
    name_th: "",
    name_en: ""
  })

  // Fetch tags from API
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoading(true)
        const response = await tagService.getTagsWithStats()
        setTags(response)
        setFilteredTags(response)
        setError(null)
      } catch (err) {
        setError("Failed to fetch tags")
        console.error("Error fetching tags:", err)
        toast.error("ไม่สามารถโหลดข้อมูลแท็กได้")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTags()
  }, [])

  // Search functionality with debouncing
  useEffect(() => {
    const searchTags = async () => {
      if (!searchTerm.trim()) {
        setFilteredTags(tags)
        return
      }

      setIsSearching(true)
      try {
        const searchResults = await tagService.searchTags(searchTerm, 100)
        setFilteredTags(searchResults)
      } catch (err) {
        console.error("Search error:", err)
        // Fallback to local filtering
        const localFiltered = tags.filter((tag) => {
          const searchText = `${tag.name_th} ${tag.name_en} ${tag.slug}`.toLowerCase()
          return searchText.includes(searchTerm.toLowerCase())
        })
        setFilteredTags(localFiltered)
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchTags, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, tags])

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
        // Update existing tag
        const response = await tagService.updateTag(editingTag.id, formData)
        const updatedTag = response.data
        setTags(tags.map((tag) => (tag.id === editingTag.id ? { ...updatedTag, gymCount: tag.gymCount, trainerCount: tag.trainerCount } : tag)))
        setEditingTag(null)
        toast.success("แก้ไขแท็กสำเร็จ")
      } else {
        // Create new tag
        const response = await tagService.createTag(formData)
        const newTag = { ...response.data, gymCount: 0, trainerCount: 0 }
        setTags([...tags, newTag])
        setIsAddDialogOpen(false)
        toast.success("เพิ่มแท็กสำเร็จ")
      }
      resetForm()
    } catch (err) {
      console.error("Error saving tag:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      toast.error(editingTag ? `ไม่สามารถแก้ไขแท็กได้: ${errorMessage}` : `ไม่สามารถเพิ่มแท็กได้: ${errorMessage}`)
    }
  }

  const handleDeleteTag = async (tagId: number) => {
    try {
      await tagService.deleteTag(tagId)
      setTags(tags.filter((tag) => tag.id !== tagId))
      toast.success("ลบแท็กสำเร็จ")
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

  const TagForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name-th">ชื่อแท็ก (ไทย) *</Label>
        <Input
          id="name-th"
          value={formData.name_th}
          onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
          placeholder="เช่น มวยเข่า"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name-en">ชื่อแท็ก (อังกฤษ) *</Label>
        <Input
          id="name-en"
          value={formData.name_en}
          onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
          placeholder="e.g. Muay Khao"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={editingTag ? closeEditDialog : () => setIsAddDialogOpen(false)}
        >
          ยกเลิก
        </Button>
        <Button type="submit">
          {editingTag ? "อัพเดท" : "เพิ่มแท็ก"}
        </Button>
      </div>
    </form>
  )

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
                <TagForm />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hash className="mr-2 h-5 w-5" />
                รายการแท็ก ({filteredTags.length})
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
              ) : filteredTags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TagIcon className="mx-auto h-12 w-12 mb-4" />
                  <p>ไม่พบแท็กที่ค้นหา</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>ชื่อไทย</TableHead>
                        <TableHead>ชื่ออังกฤษ</TableHead>
                        <TableHead className="text-center">ยิม</TableHead>
                        <TableHead className="text-center">ครูมวย</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTags.map((tag) => (
                        <TableRow key={tag.id}>
                          <TableCell className="font-mono text-sm">{tag.id}</TableCell>
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
                                  <TagForm />
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
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
} 