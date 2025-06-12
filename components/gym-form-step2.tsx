"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { CollapsibleTagSelector } from "@/components/collapsible-tag-selector";
import type { Gym } from "@/lib/types";

interface GymFormStep2Props {
  gym?: Gym;
  initialData: Partial<Gym>;
  onSubmit: (data: Omit<Gym, "id" | "joinedDate">) => void;
  onBack: () => void;
  onSave: (data: Partial<Gym>) => Promise<void>;
}

export function GymFormStep2({
  gym,
  initialData,
  onSubmit,
  onBack,
  onSave,
}: GymFormStep2Props) {
  const [formData, setFormData] = useState({
    ...initialData,
    images: gym?.images || [],
    tags: gym?.tags || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    console.log("handleSubmit called - isEditMode:", isEditMode);
    setIsSubmitting(true);
    try {
      // Merge all form data properly
      const completeFormData = {
        ...initialData, // Step 1 data
        ...formData, // Step 2 data (images, tags)
      };
      console.log("Calling onSave with completeFormData:", completeFormData);
      await onSave(completeFormData);
      
      console.log("onSave completed, now calling onSubmit");
      onSubmit(completeFormData as Omit<Gym, "id" | "joinedDate">);
    } catch (error) {
      console.error("Error submitting gym form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Merge all form data properly
      const completeFormData = {
        ...initialData, // Step 1 data
        ...formData, // Step 2 data (images, tags)
      };
      console.log("completeFormData", completeFormData);
      
      await onSave(completeFormData);
      
      // Show success toast without closing dialog
      const { toast } = await import("sonner");
      toast.success("บันทึกข้อมูลสำเร็จ", {
        description: "ข้อมูลของคุณได้รับการบันทึกแล้ว"
      });
    } catch (error) {
      console.error("Error saving:", error);
      const { toast } = await import("sonner");
      toast.error("ไม่สามารถบันทึกข้อมูลได้", {
        description: "กรุณาลองอีกครั้งหรือติดต่อผู้ดูแลระบบ"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if we're in edit mode
  const isEditMode = !!gym;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            ✓
          </div>
          <span className="ml-2 text-sm font-medium text-green-600">
            ข้อมูลพื้นฐาน
          </span>
        </div>
        <div className="flex-1 h-px bg-blue-600"></div>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="ml-2 text-sm font-medium text-blue-600">
            รูปภาพและสิ่งอำนวยความสะดวก
          </span>
        </div>
      </div>

      {/* Images */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">รูปภาพยิม (Gym Images)</CardTitle>
          <p className="text-sm text-muted-foreground">
            อัปโหลดรูปภาพคุณภาพสูงของยิมได้สูงสุด 5 รูป รูปภาพจะถูกเก็บไว้ใน
            Bunny.net CDN
          </p>
        </CardHeader>
        <CardContent>
          <ImageUpload
            images={formData.images || []}
            onImagesChange={(images) => setFormData({ ...formData, images })}
            maxImages={5}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* SEO Tags */}
      <CollapsibleTagSelector
        selectedTags={formData.tags || []}
        onTagsChange={(tags) => setFormData({ ...formData, tags })}
        disabled={isSubmitting}
      />

      {/* Form Actions */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          ย้อนกลับ
        </Button>
        <div className="flex gap-2">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={isEditMode ? handleSave : handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "กำลังบันทึก..." : gym ? "บันทึก" : "สร้างยิม"}
          </Button>
        </div>
      </div>
    </div>
  );
}
