"use client"

import { useState, useEffect, useRef } from "react"
import { GymFormStep1 } from "@/components/gym-form-step1"
import { GymFormStep2 } from "@/components/gym-form-step2"
import type { Gym } from "@/lib/types"

interface GymFormMultiStepProps {
  gym?: Gym
  onSubmit: (gym: Omit<Gym, "id" | "joinedDate">) => void
  onCancel: () => void
  onSaveOnly?: (gym: Omit<Gym, "id" | "joinedDate">) => Promise<void>
  onSuccess?: () => void
  onStep1Success?: () => void
}

export function GymFormMultiStep({ gym, onSubmit, onCancel, onSaveOnly, onSuccess, onStep1Success }: GymFormMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Partial<Gym>>({})
  const [initialGymId, setInitialGymId] = useState<string | undefined>(gym?.id)
  const [isSaving, setIsSaving] = useState(false)
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // NEVER reset if we're on step 2 - this is the most important rule
    if (currentStep === 2) {
      // Just update the initialGymId to track the current gym
      if (gym?.id && gym.id !== initialGymId) {
        setInitialGymId(gym.id);
      }
      return;
    }
    
    // Don't reset if we're currently saving
    if (isSaving) {
      return;
    }
    
    // Only reset the form if we're switching to a completely different gym or creating a new one
    // Don't reset if it's just the same gym being updated (data refresh)
    const isNewGym = gym?.id !== initialGymId
    
    if (isNewGym) {
      setCurrentStep(1)
      setStep1Data({})
      setInitialGymId(gym?.id)
    }
  }, [gym?.id, initialGymId, isSaving, currentStep]) // Include currentStep in dependencies

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // Save function that either saves existing gym or does nothing for new gyms
  const handleSave = async (data: Partial<Gym>) => {
    if (!gym || !onSaveOnly) {
      return
    }
    
    setIsSaving(true);
    try {
      await onSaveOnly(data as Omit<Gym, "id" | "joinedDate">)
    } finally {
      setIsSaving(false);
    }
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

  // Enhanced onSuccess wrapper that prevents immediate reset
  const handleSuccess = () => {
    setIsSaving(true);
    onSuccess?.();
    // Clear saving state after a short delay
    setTimeout(() => {
      setIsSaving(false);
    }, 200);
  };

  // Step 1 specific success handler
  const handleStep1SuccessWrapper = () => {
    setIsSaving(true);
    onStep1Success?.();
    // Clear saving state after a short delay
    setTimeout(() => {
      setIsSaving(false);
    }, 200);
  };

  if (currentStep === 1) {
    return <GymFormStep1 
      gym={gym} 
      onNext={handleStep1Next} 
      onCancel={onCancel} 
      onSave={handleSave}
      onSuccess={handleStep1SuccessWrapper}
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
