"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { PrivateClass } from "@/lib/types"

interface PrivateClassManagerProps {
  privateClasses: PrivateClass[]
  onClassesChange: (classes: PrivateClass[]) => void
  disabled?: boolean
}

interface ClassFormData {
  name: {
    th: string
    en: string
  }
  description: {
    th: string
    en: string
  }
  duration: number
  price: number
  currency: string
  maxStudents: number
  isActive: boolean
}

export function PrivateClassManager({ privateClasses, onClassesChange, disabled = false }: PrivateClassManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<PrivateClass | null>(null)
  const [formData, setFormData] = useState<ClassFormData>({
    name: { th: "", en: "" },
    description: { th: "", en: "" },
    duration: 60,
    price: 1000,
    currency: "THB",
    maxStudents: 1,
    isActive: true,
  })

  const handleAddClass = () => {
    if (!formData.name.th.trim() || !formData.description.th.trim()) return

    const newClass: PrivateClass = {
      id: Date.now().toString(),
      ...formData,
      createdDate: new Date().toISOString().split("T")[0],
    }

    onClassesChange([...privateClasses, newClass])
    resetForm()
    setIsAddDialogOpen(false)
  }

  const handleEditClass = () => {
    if (!editingClass || !formData.name.th.trim() || !formData.description.th.trim()) return

    const updatedClasses = privateClasses.map((cls) =>
      cls.id === editingClass.id
        ? {
            ...cls,
            ...formData,
          }
        : cls,
    )

    onClassesChange(updatedClasses)
    setEditingClass(null)
    resetForm()
  }

  const handleDeleteClass = (classId: string) => {
    onClassesChange(privateClasses.filter((cls) => cls.id !== classId))
  }

  const openEditDialog = (privateClass: PrivateClass) => {
    setEditingClass(privateClass)
    setFormData({
      name: privateClass.name,
      description: privateClass.description,
      duration: privateClass.duration,
      price: privateClass.price,
      currency: privateClass.currency,
      maxStudents: privateClass.maxStudents,
      isActive: privateClass.isActive,
    })
  }

  const resetForm = () => {
    setFormData({
      name: { th: "", en: "" },
      description: { th: "", en: "" },
      duration: 60,
      price: 1000,
      currency: "THB",
      maxStudents: 1,
      isActive: true,
    })
  }

  const closeEditDialog = () => {
    setEditingClass(null)
    resetForm()
  }

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString()} ${currency}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }

  const ClassFormContent = () => (
    <div className="space-y-4">
      {/* Thai Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">🇹🇭 ข้อมูลภาษาไทย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="classNameTh">ชื่อคลาส (TH) *</Label>
            <Input
              id="classNameTh"
              value={formData.name.th}
              onChange={(e) => setFormData({ ...formData, name: { ...formData.name, th: e.target.value } })}
              placeholder="เช่น การฝึกมวยไทยแบบ 1 ต่อ 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classDescriptionTh">คำอธิบาย (TH) *</Label>
            <Textarea
              id="classDescriptionTh"
              value={formData.description.th}
              onChange={(e) =>
                setFormData({ ...formData, description: { ...formData.description, th: e.target.value } })
              }
              placeholder="อธิบายสิ่งที่คลาสนี้รวม..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* English Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">🇬🇧 ข้อมูลภาษาอังกฤษ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="classNameEn">Class Name (EN)</Label>
            <Input
              id="classNameEn"
              value={formData.name.en}
              onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
              placeholder="e.g. One-on-One Muay Thai Training"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classDescriptionEn">Description (EN)</Label>
            <Textarea
              id="classDescriptionEn"
              value={formData.description.en}
              onChange={(e) =>
                setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })
              }
              placeholder="Describe what this class includes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Class Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">ระยะเวลา (นาที)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              max="180"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) || 60 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-students">นักเรียนสูงสุด</Label>
            <Input
              id="max-students"
              type="number"
              min="1"
              max="10"
              value={formData.maxStudents}
              onChange={(e) => setFormData({ ...formData, maxStudents: Number.parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">ราคา</Label>
            <Input
              id="price"
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number.parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">สกุลเงิน</Label>
            <Input
              id="currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              placeholder="THB"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is-active"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="is-active">ใช้งาน (พร้อมสำหรับการจอง)</Label>
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">คลาสส่วนตัวและราคา</CardTitle>
            <p className="text-sm text-muted-foreground">จัดการเซสชันฝึกส่วนตัวและอัตราค่าบริการของคุณ</p>
          </div>
          {!disabled && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มคลาส
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>เพิ่มคลาสส่วนตัว</DialogTitle>
                </DialogHeader>
                <ClassFormContent />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleAddClass}
                    disabled={!formData.name.th.trim() || !formData.description.th.trim()}
                  >
                    เพิ่มคลาส
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {privateClasses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">ยังไม่ได้กำหนดคลาสส่วนตัว</p>
            {!disabled && <p className="text-sm text-muted-foreground mt-2">เพิ่มคลาสส่วนตัวแรกของคุณเพื่อเริ่มเสนอเซสชัน</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Classes Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อคลาส</TableHead>
                    <TableHead>ระยะเวลา</TableHead>
                    <TableHead>ราคา</TableHead>
                    <TableHead>นักเรียนสูงสุด</TableHead>
                    <TableHead>สถานะ</TableHead>
                    {!disabled && <TableHead className="text-right">การดำเนินการ</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {privateClasses.map((privateClass) => (
                    <TableRow key={privateClass.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{privateClass.name.th}</p>
                          {privateClass.name.en && (
                            <p className="text-sm text-muted-foreground">{privateClass.name.en}</p>
                          )}
                          <p className="text-sm text-muted-foreground truncate max-w-xs mt-1">
                            {privateClass.description.th}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDuration(privateClass.duration)}</TableCell>
                      <TableCell>{formatPrice(privateClass.price, privateClass.currency)}</TableCell>
                      <TableCell>{privateClass.maxStudents}</TableCell>
                      <TableCell>
                        <Badge variant={privateClass.isActive ? "default" : "secondary"}>
                          {privateClass.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
                        </Badge>
                      </TableCell>
                      {!disabled && (
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Dialog
                              open={editingClass?.id === privateClass.id}
                              onOpenChange={(open) => !open && closeEditDialog()}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(privateClass)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>แก้ไขคลาสส่วนตัว</DialogTitle>
                                </DialogHeader>
                                <ClassFormContent />
                                <div className="flex justify-end space-x-2">
                                  <Button type="button" variant="outline" onClick={closeEditDialog}>
                                    ยกเลิก
                                  </Button>
                                  <Button
                                    onClick={handleEditClass}
                                    disabled={!formData.name.th.trim() || !formData.description.th.trim()}
                                  >
                                    อัปเดตคลาส
                                  </Button>
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
                                    การดำเนินการนี้ไม่สามารถยกเลิกได้ การดำเนินการนี้จะลบคลาสส่วนตัว "{privateClass.name.th}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteClass(privateClass.id)}>
                                    ลบคลาส
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
