"use client"

import { useState } from "react"
import { TrainerFormStep1 } from "@/components/trainer-form-step1"
import { TrainerFormStep2 } from "@/components/trainer-form-step2"
import type { Trainer } from "@/lib/types"

interface TrainerFormMultiStepProps {
  trainer?: Trainer
  onSubmit: (trainer: Partial<Trainer>) => Promise<void>
  onCancel: () => void
  onSavePartial: (trainer: Partial<Trainer>) => Promise<void>
  onComplete?: () => void
  fetchTrainerData?: () => void
}

export function TrainerFormMultiStep({ trainer, onSubmit, onCancel, onSavePartial, onComplete, fetchTrainerData }: TrainerFormMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(1)
  
  const [step1Data, setStep1Data] = useState<Partial<Trainer>>(() => {
    if (trainer) {
      return {
        first_name_th: trainer.first_name_th,
        first_name_en: trainer.first_name_en,
        last_name_th: trainer.last_name_th,
        last_name_en: trainer.last_name_en,
        phone: trainer.phone,
        email: trainer.email,
        bio_th: trainer.bio_th,
        bio_en: trainer.bio_en,
        line_id: trainer.line_id,
        exp_year: trainer.exp_year,
      }
    }
    return {}
  })

  const handlePartialSave = async (data: Partial<Trainer>) => {
    if (!trainer || !onSavePartial) return
    
    try {
      await onSavePartial(data)
      setStep1Data(prevData => ({ ...prevData, ...data }))
      fetchTrainerData?.()
    } catch (error) {
      throw error
    }
  }

  const handleStep1Next = (data: Partial<Trainer>) => {
    setStep1Data(data)
    setCurrentStep(2)
  }

  const handleStep2Back = () => {
    setCurrentStep(1)
  }

  const handleFinalSubmit = async (finalData: Partial<Trainer>) => {
    await onSubmit(finalData)
    fetchTrainerData?.()
  }

  const handleStep1SaveSuccess = () => {
    // onSavePartialSuccess?.()
  }

  const handleStep2Complete = () => {
    onComplete?.()
  }

  if (currentStep === 1) {
    return <TrainerFormStep1 
      trainer={trainer} 
      onNext={handleStep1Next} 
      onCancel={onCancel} 
      onSave={handlePartialSave}
    />
  }

  return (
    <TrainerFormStep2
      trainer={trainer}
      initialData={step1Data}
      onSubmit={handleFinalSubmit}
      onBack={handleStep2Back}
      onSave={handlePartialSave}
      onCancel={onCancel}
      onSuccess={handleStep2Complete}
    />
  )
} 