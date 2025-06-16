"use client"

import { useState } from "react"
import { GymFormStep1 } from "@/components/gym-form-step1"
import { GymFormStep2 } from "@/components/gym-form-step2"
import type { Gym } from "@/lib/types"

interface GymFormMultiStepProps {
  gym?: Gym
  onSubmit?: (gym: Omit<Gym, "id" | "joinedDate">) => Promise<void>
  onCancel: () => void
  onSavePartial?: (gym: Omit<Gym, "id" | "joinedDate">) => Promise<void>
  onComplete?: () => void
  onSavePartialSuccess?: () => void
}

export function GymFormMultiStep({ gym, onSubmit, onCancel, onSavePartial, onComplete, onSavePartialSuccess }: GymFormMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(1)
  
  // Initialize step1Data directly from gym prop
  const [step1Data, setStep1Data] = useState<Partial<Gym>>(() => {
    if (gym) {
      return {
        name_th: gym.name_th,
        name_en: gym.name_en,
        phone: gym.phone,
        email: gym.email,
        description_th: gym.description_th,
        description_en: gym.description_en,
        map_url: gym.map_url,
        youtube_url: gym.youtube_url,
        line_id: gym.line_id,
        is_active: gym.is_active,
        province_id: gym.province_id || gym.province?.id,
      }
    }
    return {}
  })

  // No useEffect needed - rely on component key for resets

  // Save function that either saves existing gym or does nothing for new gyms
  const handlePartialSave = async (data: Partial<Gym>) => {
    if (!gym || !onSavePartial) {
      return
    }
    
    try {
      await onSavePartial(data as Omit<Gym, "id" | "joinedDate">)
      // Update step1Data with the saved data to ensure consistency
      setStep1Data(prevData => ({ ...prevData, ...data }))
    } catch (error) {
      throw error
    }
  }

  const handleStep1Next = (data: Partial<Gym>) => {
    // Always update step1Data with the latest data from step 1
    setStep1Data(data)
    setCurrentStep(2)
  }

  const handleStep2Back = () => {
    setCurrentStep(1)
  }

  const handleFinalSubmit = async (finalData: Omit<Gym, "id" | "joinedDate">) => {
    if (onSubmit) {
      await onSubmit(finalData)
    }
  }

  // Handle successful save in step 1 (edit mode)
  const handleStep1SaveSuccess = () => {
    if (onSavePartialSuccess) {
      onSavePartialSuccess()
    }
  }

  // Handle completion from step 2
  const handleStep2Complete = () => {
    if (onComplete) {
      onComplete()
    }
  }

  if (currentStep === 1) {
    return <GymFormStep1 
      gym={gym} 
      onNext={handleStep1Next} 
      onCancel={onCancel} 
      onSave={handlePartialSave}
      onSuccess={handleStep1SaveSuccess}
    />
  }

  return (
    <GymFormStep2
      gym={gym}
      initialData={step1Data}
      onSubmit={handleFinalSubmit}
      onBack={handleStep2Back}
      onSave={handlePartialSave}
      onCancel={onCancel}
      onSuccess={handleStep2Complete}
    />
  )
}
