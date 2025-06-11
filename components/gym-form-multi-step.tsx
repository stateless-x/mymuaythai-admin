"use client"

import { useState } from "react"
import { GymFormStep1 } from "@/components/gym-form-step1"
import { GymFormStep2 } from "@/components/gym-form-step2"
import type { Gym } from "@/lib/types"

interface GymFormMultiStepProps {
  gym?: Gym
  onSubmit: (gym: Omit<Gym, "id" | "joinedDate">) => void
  onCancel: () => void
}

export function GymFormMultiStep({ gym, onSubmit, onCancel }: GymFormMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Partial<Gym>>({})

  // Mock API call for soft save
  const handleSoftSave = async (data: Partial<Gym>) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log("Soft saving data:", data)
    // In real implementation, this would make a PUT request to save draft
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
    return <GymFormStep1 gym={gym} onNext={handleStep1Next} onCancel={onCancel} onSave={handleSoftSave} />
  }

  return (
    <GymFormStep2
      gym={gym}
      initialData={step1Data}
      onSubmit={handleFinalSubmit}
      onBack={handleStep2Back}
      onSave={handleSoftSave}
    />
  )
}
