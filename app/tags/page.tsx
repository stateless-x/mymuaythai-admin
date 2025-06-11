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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Loader2, Hash } from "lucide-react"
import { toast } from "sonner"
import type { Tag } from "@/lib/types"
import { tagsApi } from "@/lib/api"

interface TagFormData {
  name: { th: string; en: string }
  description?: { th?: string; en?: string }
  color: string
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<TagFormData>({
    name: { th: "", en: "" },
    description: { th: "", en: "" },
    color: "#3b82f6"
  })

  // Fetch tags from API
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoading(true)
        const data = await tagsApi.getAll()
        setTags(data)
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

  const filteredTags = tags.filter((tag) => {
    const tagName = (tag.name_th || "") + " " + (tag.name_en || "")
    return tagName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const resetForm = () => {
    setFormData({
      name: { th: "", en: "" },
      description: { th: "", en: "" },
      color: "#3b82f6"
    })
  }

  const handleOpenAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (tag: Tag) => {
    setFormData({
      name: { th: tag.name_th || "", en: tag.name_en || "" },
      description: tag.description || { th: "", en: "" },
      color: tag.color || "#3b82f6"
    })
    setEditingTag(tag)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.th.trim()) {
      toast.error("กรุณากรอกชื่อแท็กภาษาไทย")
      return
    }

    try {
      if (editingTag) {
        // Update existing tag
        const updatedTag = await tagsApi.update(editingTag.id, formData)
        setTags(tags.map((tag) => (tag.id === editingTag.id ? updatedTag : tag)))
        setEditingTag(null)
        toast.success("แก้ไขแท็กสำเร็จ")
      } else {
        // Create new tag
        const newTag = await tagsApi.create(formData)
        setTags([...tags, newTag])
        setIsAddDialogOpen(false)
        toast.success("เพิ่มแท็กสำเร็จ")
      }
      resetForm()
    } catch (err) {
      console.error("Error saving tag:", err)
      toast.error(editingTag ? "ไม่สามารถแก้ไขแท็กได้" : "ไม่สามารถเพิ่มแท็กได้")
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    try {
      await tagsApi.delete(tagId)
      setTags(tags.filter((tag) => tag.id !== tagId))
      toast.success("ลบแท็กสำเร็จ")
    } catch (err) {
      console.error("Error deleting tag:", err)
      toast.error("ไม่สามารถลบแท็กได้")
    }
  }

  const TagForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name-th">ชื่อแท็ก (ไทย) *</Label>
          <Input
            id="name-th"
            value={formData.name.th}
            onChange={(e) => setFormData({ ...formData, name: { ...formData.name, th: e.target.value } })}
            placeholder="เช่น เปิดใหม่"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name-en">ชื่อแท็ก (อังกฤษ)</Label>
          <Input
            id="name-en"
            value={formData.name.en}
            onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
            placeholder="e.g. New Opening"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description-th">คำอธิบาย (ไทย)</Label>
          <Textarea
            id="description-th"
            value={formData.description?.th || ""}
            onChange={(e) => setFormData({ 
              ...formData, 
              description: { ...formData.description, th: e.target.value } 
            })}
            placeholder="คำอธิบายเพิ่มเติม..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description-en">คำอธิบาย (อังกฤษ)</Label>
          <Textarea
            id="description-en"
            value={formData.description?.en || ""}
            onChange={(e) => setFormData({ 
              ...formData, 
              description: { ...formData.description, en: e.target.value } 
            })}
            placeholder="Additional description..."
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">สีของแท็ก</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-16 h-10"
          />
          <Input
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="#3b82f6"
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            resetForm()
            setIsAddDialogOpen(false)
            setEditingTag(null)
          }}
        >
          ยกเลิก
        </Button>
        <Button type="submit">
          {editingTag ? "บันทึกการแก้ไข" : "เพิ่มแท็ก"}
        </Button>
      </div>
    </form>
  )

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
              <h1 className="text-3xl font-bold tracking-tight">แท็ก</h1>
              <p className="text-muted-foreground">จัดการแท็กสำหรับการจำแนกประเภท</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />+ เพิ่มแท็กใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>เพิ่มแท็กใหม่</DialogTitle>
                </DialogHeader>
                <TagForm />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาแท็ก..."
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
                  <TableHead>แท็ก</TableHead>
                  <TableHead>คำอธิบาย</TableHead>
                  <TableHead>สี</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4" style={{ color: tag.color }} />
                        <div>
                          <div className="font-medium">
                            {tag.name_th}
                          </div>
                          {tag.name_en && (
                            <div className="text-sm text-muted-foreground">{tag.name_en}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {tag.description && typeof tag.description === "object" && tag.description.th && (
                          <div className="text-sm">{tag.description.th}</div>
                        )}
                        {tag.description && typeof tag.description === "object" && tag.description.en && (
                          <div className="text-xs text-muted-foreground">{tag.description.en}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm font-mono">{tag.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Dialog open={editingTag?.id === tag.id} onOpenChange={(open) => !open && setEditingTag(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(tag)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>แก้ไขแท็ก</DialogTitle>
                            </DialogHeader>
                            <TagForm />
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
                                การดำเนินการนี้ไม่สามารถยกเลิกได้ การลบแท็กนี้จะทำให้ยิมและครูมวยที่ใช้แท็กนี้ไม่มีแท็กนี้อีกต่อไป
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTag(tag.id)}>ลบ</AlertDialogAction>
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

          {filteredTags.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">ไม่พบแท็ก</p>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
} 