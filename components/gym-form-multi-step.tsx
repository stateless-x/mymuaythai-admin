"use client"

import { useState } from "react"
import { GymFormStep1 } from "@/components/gym-form-step1"
import { GymFormStep2 } from "@/components/gym-form-step2"
import type { Gym, Tag } from "@/lib/types"
import { tagsApi } from "@/lib/api"

interface GymFormMultiStepProps {
  gym?: Gym
  onSubmit: (gym: Partial<Gym>) => Promise<void>
  onCreate?: (gym: Partial<Gym>) => Promise<Gym | undefined>
  onCancel: () => void
  onSavePartial?: (gym: Partial<Gym>) => Promise<void>
  onComplete?: () => void
}

// Helper function to convert tag slugs to tag objects with IDs
const convertTagSlugsToTagObjects = async (tagSlugs: string[]): Promise<Tag[]> => {
  if (!tagSlugs || tagSlugs.length === 0) {
    return [];
  }
  
  try {
    const tagPromises = tagSlugs.map(async (slug) => {
      try {
        const response = await tagsApi.getAll({ searchTerm: slug, pageSize: 10 });
        const tags = response.data?.items || response.data || response;
        const foundTag = tags.find((tag: any) => tag.slug === slug);
        return foundTag || null;
      } catch (err) {
        console.error(`Failed to get tag with slug: ${slug}`, err);
        return null;
      }
    });
    
    const tags = await Promise.all(tagPromises);
    return tags.filter((tag): tag is Tag => tag !== null);
  } catch (error) {
    console.error('Error converting tag slugs to objects:', error);
    return [];
  }
};

export function GymFormMultiStep({ gym: initialGym, onSubmit, onCreate, onCancel, onSavePartial, onComplete }: GymFormMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [gym, setGym] = useState<Partial<Gym> | undefined>(initialGym)
  const [isCreating, setIsCreating] = useState(false)
  
  // This state holds the data from step 1, which needs to be merged in the final submit
  const [step1Data, setStep1Data] = useState<Partial<Gym>>(() => {
    if (initialGym) {
      return {
        name_th: initialGym.name_th,
        name_en: initialGym.name_en,
        phone: initialGym.phone,
        email: initialGym.email,
        description_th: initialGym.description_th,
        description_en: initialGym.description_en,
        map_url: initialGym.map_url,
        youtube_url: initialGym.youtube_url,
        line_id: initialGym.line_id,
        is_active: initialGym.is_active,
        province_id: initialGym.province_id || initialGym.province?.id,
      }
    }
    return {}
  })

  const handlePartialSave = async (data: Partial<Gym>) => {
    if (!gym || !onSavePartial) {
      return
    }
    
    try {
      await onSavePartial(data)
      setStep1Data(prevData => ({ ...prevData, ...data }))
      setGym(prevGym => ({...prevGym, ...data}))
    } catch (error) {
      throw error
    }
  }

  const handleStep1Next = (data: Partial<Gym>) => {
    setStep1Data(data)
    setCurrentStep(2)
  }

  const handleCreateAndNext = async (data: Partial<Gym>) => {
    if (!onCreate) return
    setIsCreating(true)
    try {
      const createdGym = await onCreate(data)
      if (createdGym) {
        setGym(createdGym)
        setStep1Data(createdGym)
        setCurrentStep(2)
      }
    } catch (error) {
    } finally {
      setIsCreating(false)
    }
  }

  const handleStep2Back = () => {
    setCurrentStep(1)
  }

  const handleFinalSubmit = async (step2Data: Partial<Gym>) => {
    const tagObjects = await convertTagSlugsToTagObjects(step2Data.tags as string[] || []);

    const finalData = { 
      ...step1Data, 
      ...step2Data,
      tags: tagObjects,
      id: gym?.id 
    }
    
    await onSubmit(finalData as any)
    if (onComplete) {
      onComplete()
    }
  }

  if (currentStep === 1) {
    return <GymFormStep1 
      gym={gym} 
      onNext={initialGym ? handleStep1Next : handleCreateAndNext} 
      onCancel={onCancel} 
      onSave={handlePartialSave}
      isSubmitting={isCreating}
    />
  }

  return (
    <GymFormStep2
      gym={gym as Gym} // By step 2, gym should be defined
      initialData={step1Data}
      onSubmit={handleFinalSubmit}
      onBack={handleStep2Back}
      onSave={handlePartialSave}
      onCancel={onCancel}
      onSuccess={onComplete}
    />
  )
}
