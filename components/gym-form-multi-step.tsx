"use client"

import { useState, useEffect } from "react"
import { GymFormStep1 } from "@/components/gym-form-step1"
import { GymFormStep2 } from "@/components/gym-form-step2"
import type { Gym } from "@/lib/types"

interface GymFormMultiStepProps {
  gym?: Gym
  onSubmit: (gym: Omit<Gym, "id" | "joinedDate">) => void
  onCancel: () => void
  onSaveOnly?: (gym: Omit<Gym, "id" | "joinedDate">) => Promise<void>
  onSuccess?: () => void
}

export function GymFormMultiStep({ gym, onSubmit, onCancel, onSaveOnly, onSuccess }: GymFormMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Partial<Gym>>({})

  useEffect(() => {
    // When the gym prop changes (e.g., opening for a different gym or for creation),
    // reset the form to its initial state to prevent displaying stale data.
    setCurrentStep(1)
    setStep1Data({})
  }, [gym])

  // Save function that either saves existing gym or does nothing for new gyms
  const handleSave = async (data: Partial<Gym>) => {
    if (!gym || !onSaveOnly) {
      return
    }
    
    await onSaveOnly(data as Omit<Gym, "id" | "joinedDate">)
  }

  const handleStep1Next = (data: Partial<Gym>) => {
    setStep1Data(data)
    setCurrentStep(2)
  }

  const handleStep2Back = () => {
    setCurrentStep(1)
  }

  const handleFinalSubmit = (finalData: Omit<Gym, "id" | "joinedDate">) => {
    onSubmit(finalData)
  }

  if (currentStep === 1) {
    return <GymFormStep1 
      gym={gym} 
      onNext={handleStep1Next} 
      onCancel={onCancel} 
      onSave={handleSave}
      onSuccess={onSuccess}
    />
  }

  return (
    <GymFormStep2
      gym={gym}
      initialData={step1Data}
      onSubmit={handleFinalSubmit}
      onBack={handleStep2Back}
      onSave={handleSave}
      onCancel={onCancel}
      onSuccess={onSuccess}
    />
  )
}
