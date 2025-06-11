"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, TagIcon } from "lucide-react"
import type { Tag } from "@/lib/types"
import { TAG_CATEGORIES } from "@/lib/types"
import { mockTags } from "@/lib/mock-data"

interface TagFormData {
  name: string
  category: string
  color: string
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>(mockTags)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState<TagFormData>({
    name: "",
    category: "",
    color: "#6b7280",
  })

  const filteredTags = tags.filter((tag) => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || tag.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleAddTag = () => {
    if (!formData.name.trim() || !formData.category) return

    const newTag: Tag = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      category: formData.category as any,
      color: formData.color,
      createdDate: new Date().toISOString().split("T")[0],
      usageCount: 0,
    }

    setTags([...tags, newTag])
    setFormData({ name: "", category: "", color: "#6b7280" })
    setIsAddDialogOpen(false)
  }

  const handleEditTag = () => {
    if (!editingTag || !formData.name.trim() || !formData.category) return

    setTags(
      tags.map((tag) =>
        tag.id === editingTag.id
          ? {
              ...tag,
              name: formData.name.trim(),
              category: formData.category as any,
              color: formData.color,
            }
          : tag,
      ),
    )

    setEditingTag(null)
    setFormData({ name: "", category: "", color: "#6b7280" })
  }

  const handleDeleteTag = (tagId: string) => {
    setTags(tags.filter((tag) => tag.id !== tagId))
  }

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      category: tag.category,
      color: tag.color,
    })
  }

  const closeEditDialog = () => {
    setEditingTag(null)
    setFormData({ name: "", category: "", color: "#6b7280" })
  }

  const getCategoryInfo = (categoryValue: string) => {
    return TAG_CATEGORIES.find((cat) => cat.value === categoryValue)
  }

  const getTagStats = () => {
    const totalTags = tags.length
    const totalUsage = tags.reduce((sum, tag) => sum + tag.usageCount, 0)
    const categoryStats = TAG_CATEGORIES.map((category) => ({
      ...category,
      count: tags.filter((tag) => tag.category === category.value).length,
    }))

    return { totalTags, totalUsage, categoryStats }
  }

  const stats = getTagStats()

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">แท็กสำหรับการค้นหา</h1>
              <p className="text-muted-foreground">จัดการแท็กสำหรับเทรนเนอร์และยิม</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />+ เพิ่มรายการใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>เพิ่มแท็กใหม่</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tag-name">ชื่อแท็ก *</Label>
                    <Input
                      id="tag-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., MuayThai, Bangkok"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tag-category">หมวดหมู่ *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        const categoryInfo = getCategoryInfo(value)
                        setFormData({
                          ...formData,
                          category: value,
                          color: categoryInfo?.color || "#6b7280",
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        {TAG_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tag-color">สี</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="tag-color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#6b7280"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>ตัวอย่าง</Label>
                    <Badge style={{ backgroundColor: formData.color }}>#{formData.name || "TagName"}</Badge>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                    <Button onClick={handleAddTag} disabled={!formData.name.trim() || !formData.category}>
                      เพิ่มแท็ก
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">แท็กทั้งหมด</CardTitle>
                <TagIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTags}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การถูกใช้งานทั้งหมด</CardTitle>
                <TagIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsage}</div>
              </CardContent>
            </Card>

            {stats.categoryStats.slice(0, 2).map((category) => (
              <Card key={category.value}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{category.label}</CardTitle>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{category.count}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาแท็ก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="กรองตามหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">หมวดหมู่แท็กทั้งหมด</SelectItem>
                {TAG_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>แท็ก</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>จำนวนการใช้งาน</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.map((tag) => {
                  const categoryInfo = getCategoryInfo(tag.category)

                  return (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <Badge style={{ backgroundColor: tag.color }}>#{tag.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryInfo?.color }} />
                          <span>{categoryInfo?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>{tag.usageCount}</TableCell>
                      <TableCell>{new Date(tag.createdDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog open={editingTag?.id === tag.id} onOpenChange={(open) => !open && closeEditDialog()}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => openEditDialog(tag)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>แก้ไขแท็ก</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-tag-name">ชื่อแท็ก *</Label>
                                  <Input
                                    id="edit-tag-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-tag-category">หมวดหมู่ *</Label>
                                  <Select
                                    value={formData.category}
                                    onValueChange={(value) => {
                                      const categoryInfo = getCategoryInfo(value)
                                      setFormData({
                                        ...formData,
                                        category: value,
                                        color: categoryInfo?.color || formData.color,
                                      })
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TAG_CATEGORIES.map((category) => (
                                        <SelectItem key={category.value} value={category.value}>
                                          <div className="flex items-center space-x-2">
                                            <div
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: category.color }}
                                            />
                                            <span>{category.label}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-tag-color">สี</Label>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      id="edit-tag-color"
                                      type="color"
                                      value={formData.color}
                                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                      className="w-16 h-10"
                                    />
                                    <Input
                                      value={formData.color}
                                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                      className="flex-1"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>ตัวอย่าง</Label>
                                  <Badge style={{ backgroundColor: formData.color }}>#{formData.name}</Badge>
                                </div>

                                <div className="flex justify-end space-x-2">
                                  <Button type="button" variant="outline" onClick={closeEditDialog}>
                                    ยกเลิก
                                  </Button>
                                  <Button
                                    onClick={handleEditTag}
                                    disabled={!formData.name.trim() || !formData.category}
                                  >
                                    อัปเดตแท็ก
                                  </Button>
                                </div>
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
                                  การดำเนินการนี้ไม่สามารถยกเลิกได้ การดำเนินการนี้จะลบแท็ก "{tag.name}" และ
                                  ลบออกจากเทรนเนอร์และยิมทั้งหมด
                                  {tag.usageCount > 0 && (
                                    <span className="block mt-2 font-medium text-destructive">
                                      คำเตือน: แท็กนี้กำลังถูกใช้งาน {tag.usageCount} ครั้ง
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTag(tag.id)}>ลบแท็ก</AlertDialogAction>
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

          {filteredTags.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {searchTerm || filterCategory !== "all" ? "ไม่พบแท็กที่ตรงกับเกณฑ์ของคุณ" : "ไม่พบแท็ก"}
              </p>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
