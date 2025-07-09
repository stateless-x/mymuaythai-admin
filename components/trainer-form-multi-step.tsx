"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { TrainerFormStep1 } from "@/components/trainer-form-step1"
import { TrainerFormStep2 } from "@/components/trainer-form-step2"
import type { Trainer } from "@/lib/types"

interface TrainerFormMultiStepProps {
  trainer?: Trainer
  onSubmit: (trainer: Partial<Trainer>) => Promise<void>
  onCancel: () => void
  onSavePartial?: (trainer: Partial<Trainer>) => Promise<void>
  onComplete?: () => void
  onCreate?: (trainer: Partial<Trainer>) => Promise<any>
}

export function TrainerFormMultiStep({ trainer: initialTrainer, onSubmit, onCancel, onSavePartial, onComplete, onCreate }: TrainerFormMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [trainer, setTrainer] = useState<Trainer | undefined>(initialTrainer)
  
  const [step1Data, setStep1Data] = useState<Partial<Trainer>>(() => {
    if (initialTrainer) {
      return {
        first_name_th: initialTrainer.first_name_th,
        first_name_en: initialTrainer.first_name_en,
        last_name_th: initialTrainer.last_name_th,
        last_name_en: initialTrainer.last_name_en,
        phone: initialTrainer.phone,
        email: initialTrainer.email,
        bio_th: initialTrainer.bio_th,
        bio_en: initialTrainer.bio_en,
        line_id: initialTrainer.line_id,
        exp_year: initialTrainer.exp_year,
      }
    }
    return {}
  })

  useEffect(() => {
    setTrainer(initialTrainer)
  }, [initialTrainer])

  const handlePartialSave = async (data: Partial<Trainer>) => {
    if (!trainer || !onSavePartial) return
    
    try {
      await onSavePartial({ ...trainer, ...data })
      setStep1Data(prevData => ({ ...prevData, ...data }))
    } catch (error) {
      throw error
    }
  }

  const handleStep1Next = async (data: Partial<Trainer>) => {
    setStep1Data(data)
    if (!trainer?.id) {
      if (!onCreate) {
        console.error("onCreate prop is required for creating a new trainer")
        return
      }
      setIsCreating(true)
      try {
        const newTrainer = await onCreate(data)
        if (newTrainer?.id) {
          setTrainer(newTrainer)
          setCurrentStep(2)
        } else {
          toast.error("ไม่สามารถสร้างครูมวยได้", {
            description: "ไม่ได้รับข้อมูลครูมวยที่สร้างขึ้นจากเซิร์ฟเวอร์",
          })
        }
      } catch (error) {
        throw error
      } finally {
        setIsCreating(false)
      }
    } else if (onSavePartial) {
      try {
        await onSavePartial({ ...trainer, ...data })
        setCurrentStep(2)
      } catch (error) {
        console.error("Failed to save partial trainer data", error)
      }
    } else {
      setCurrentStep(2)
    }
  }

  const handleStep2Back = () => {
    setCurrentStep(1)
  }

  const handleFinalSubmit = async (finalData: Partial<Trainer>) => {
    await onSubmit({ ...trainer, ...finalData })
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
      onSave={handlePartialSave!}
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