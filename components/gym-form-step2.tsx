"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { CollapsibleTagSelector } from "@/components/collapsible-tag-selector";
import { TrainerSelector, TrainerSelectorRef } from "@/components/trainer-selector";
import { batchUpdateTrainerGymAssociations } from "@/lib/api";
import { trimFormData } from "@/lib/utils/form-helpers";
import type { Gym, Trainer, Tag } from "@/lib/types";

interface GymFormStep2Props {
  gym?: Gym;
  initialData: Partial<Gym>;
  onSubmit: (data: Partial<Gym>) => void;
  onBack: () => void;
  onSave: (data: Partial<Gym>) => Promise<void>;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function GymFormStep2({
  gym,
  initialData,
  onSubmit,
  onBack,
  onSave,
  onCancel,
  onSuccess,
}: GymFormStep2Props) {
  // Helper function to extract tag slugs from tag objects or use as-is if already slugs
  const getTagSlugs = (tags: any[]): string[] => {
    if (!tags || !Array.isArray(tags)) return [];
    
    return tags.map((tag: any) => {
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
  };

  const [formData, setFormData] = useState({
    ...initialData,
    images: (gym?.images || []) as (string | { id?: string; image_url: string })[],
    tags: getTagSlugs(gym?.tags || []), // Extract tag slugs from backend data
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
      tags: getTagSlugs(gym?.tags || []), // Extract tag slugs from backend data
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
      try {
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
      } catch (error) {
        console.error("Error updating trainers:", error);
        // Let the caller handle the toast for the thrown error
        throw error;
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (gym?.id) {
        await handleTrainerUpdates(gym.id);
      }
      
      // We no longer convert tags here. The parent component does it.
      // We pass the raw form data (with tag slugs) up to the parent.
      const step2Data = {
        images: formData.images,
        tags: formData.tags, 
      };

      // Pass data up to the multi-step form to handle the final submission
      await onSubmit(step2Data);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      const { toast } = await import("sonner");
      toast.error("ไม่สามารถบันทึกข้อมูลได้", {
        description: error instanceof Error ? error.message : "กรุณาลองอีกครั้ง",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if we're in edit mode
  const isEditMode = !!gym?.id;

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
            onImagesChange={(newImages) => setFormData({ ...formData, images: newImages })}
            maxImages={5}
            disabled={isSubmitting}
            uploadUrl={gym?.id ? `/api/gyms/${gym.id}/images` : undefined}
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
            {isSubmitting ? "กำลังบันทึก..." : "บันทึกยิม"}
          </Button>
        </div>
      </div>
    </div>
  );
}
