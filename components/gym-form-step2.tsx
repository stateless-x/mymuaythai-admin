"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { CollapsibleTagSelector } from "@/components/collapsible-tag-selector";
import { TrainerSelector, TrainerSelectorRef } from "@/components/trainer-selector";
import { batchUpdateTrainerGymAssociations } from "@/lib/api";
import type { Gym, Trainer } from "@/lib/types";

interface GymFormStep2Props {
  gym?: Gym;
  initialData: Partial<Gym>;
  onSubmit: (data: Omit<Gym, "id" | "joinedDate">) => void;
  onBack: () => void;
  onSave: (data: Partial<Gym>) => Promise<void>;
  onCancel: () => void;
  onSuccess?: () => void;
}

// Helper function for authenticated requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  
  // Get auth token if available
  const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth-token");
    }
    return null;
  };
  
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch {
      errorDetails = await response.text();
    }
    
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetails)}`);
  }
  
  return response.json();
};

export function GymFormStep2({
  gym,
  initialData,
  onSubmit,
  onBack,
  onSave,
  onCancel,
  onSuccess,
}: GymFormStep2Props) {
  const [formData, setFormData] = useState({
    ...initialData,
    images: gym?.images || [],
    tags: gym?.tags || [],
  });
  
  const [selectedTrainers, setSelectedTrainers] = useState<Trainer[]>([]);
  const [trainersToRemove, setTrainersToRemove] = useState<string[]>([]);
  const [originalTrainers, setOriginalTrainers] = useState<Trainer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add ref to TrainerSelector
  const trainerSelectorRef = useRef<TrainerSelectorRef>(null);

  useEffect(() => {
    // When the base gym data or the data from step 1 changes,
    // update the form state accordingly to prevent stale data.
    setFormData({
      ...initialData,
      images: gym?.images || [],
      tags: gym?.tags || [],
    })
  }, [gym, initialData])

  const handleTrainerUpdates = async (gymId: string) => {
    // Get the complete list from TrainerSelector instead of comparing manually
    const completeTrainerList = trainerSelectorRef.current?.getCompleteTrainerList() || [];
    const completeTrainerIds = completeTrainerList.map(t => t.id);
    
    // Compare complete list with original to determine actual additions and removals
    const originalTrainerIds = originalTrainers.map(t => t.id);
    
    const addTrainers = completeTrainerIds.filter(id => !originalTrainerIds.includes(id));
    const removeTrainers = originalTrainerIds.filter(id => !completeTrainerIds.includes(id));

    // Only make API calls if there are changes
    if (addTrainers.length > 0 || removeTrainers.length > 0) {
      const result = await batchUpdateTrainerGymAssociations(addTrainers, removeTrainers, gymId);
      
      if (!result.success) {
        const { toast } = await import("sonner");
        toast.error("ไม่สามารถอัปเดตครูมวยได้", {
          description: result.error || "กรุณาลองอีกครั้ง"
        });
        throw new Error(result.error || "Failed to update trainers");
      } else if (result.errors && result.errors.length > 0) {
        const { toast } = await import("sonner");
        toast.warning("อัปเดตครูมวยบางส่วนไม่สำเร็จ", {
          description: `${result.errors.length} การอัปเดตล้มเหลว`
        });
      }
      
      // After successful API update, use the handleUpdateWithoutRefetch method
      trainerSelectorRef.current?.handleUpdateWithoutRefetch();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const completeTrainerList = trainerSelectorRef.current?.getCompleteTrainerList() || [];
      const completeTrainerIds = completeTrainerList.map(t => t.id);

      const completeFormData = {
        ...initialData,
        ...formData,
        associatedTrainers: completeTrainerIds,
      };

      if (gym) {
        // Update logic - for edit mode, don't close the dialog automatically
        await onSave(completeFormData);
        if (gym.id) {
          await handleTrainerUpdates(gym.id);
        }
        const { toast } = await import("sonner");
        toast.success("บันทึกข้อมูลสำเร็จ", {
          description: "ข้อมูลยิมและครูมวยได้รับการบันทึกแล้ว",
        });
        setOriginalTrainers(completeTrainerList);
        
        // For edit mode: trigger the completion callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Create logic - for create mode, let the onSubmit handler manage everything
        if (onSubmit) {
          await onSubmit(completeFormData as Omit<Gym, "id" | "joinedDate">);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      const { toast } = await import("sonner");
      toast.error("ไม่สามารถบันทึกข้อมูลได้", {
        description: "กรุณาลองอีกครั้ง",
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
            รูปภาพ, สิ่งอำนวยความสะดวก และครูมวย
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

      {/* Trainer Management */}
      <TrainerSelector
        ref={trainerSelectorRef}
        selectedTrainers={selectedTrainers}
        onTrainersChange={setSelectedTrainers}
        trainersToRemove={trainersToRemove}
        onTrainersToRemoveChange={setTrainersToRemove}
        disabled={isSubmitting}
        gymId={gym?.id}
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
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "กำลังบันทึก..." : gym ? "บันทึก" : "สร้างยิม"}
          </Button>
        </div>
      </div>
    </div>
  );
}
