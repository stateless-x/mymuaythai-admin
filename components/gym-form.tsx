"use client"

import { GymFormMultiStep } from "@/components/gym-form-multi-step"
import type { Gym } from "@/lib/types"

interface GymFormProps {
  gym?: Gym
  onSubmit: (gym: Partial<Gym>) => Promise<void>
  onCreate?: (gym: Partial<Gym>) => Promise<Gym | undefined>
  onCancel: () => void
  onSavePartial?: (gym: Partial<Gym>) => Promise<void>
  onComplete?: () => void
}

export function GymForm({ gym, onSubmit, onCreate, onCancel, onSavePartial, onComplete }: GymFormProps) {
  return <GymFormMultiStep 
    gym={gym} 
    onSubmit={onSubmit} 
    onCreate={onCreate}
    onCancel={onCancel} 
    onSavePartial={onSavePartial} 
    onComplete={onComplete} 
  />
}
