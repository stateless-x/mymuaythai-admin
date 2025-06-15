"use client"

import { GymFormMultiStep } from "@/components/gym-form-multi-step"
import type { Gym } from "@/lib/types"

interface GymFormProps {
  gym?: Gym
  onSubmit?: (gym: Omit<Gym, "id" | "joinedDate">) => Promise<void>
  onCancel: () => void
  onSavePartial?: (gym: Omit<Gym, "id" | "joinedDate">) => Promise<void>
  onComplete?: () => void
  onSavePartialSuccess?: () => void
}

export function GymForm({ gym, onSubmit, onCancel, onSavePartial, onComplete, onSavePartialSuccess }: GymFormProps) {
  return <GymFormMultiStep 
    gym={gym} 
    onSubmit={onSubmit} 
    onCancel={onCancel} 
    onSavePartial={onSavePartial} 
    onComplete={onComplete} 
    onSavePartialSuccess={onSavePartialSuccess} 
  />
}
