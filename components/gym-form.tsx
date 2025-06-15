"use client"

import { GymFormMultiStep } from "@/components/gym-form-multi-step"
import type { Gym } from "@/lib/types"

interface GymFormProps {
  gym?: Gym
  onSubmit: (gym: Omit<Gym, "id" | "joinedDate">) => void
  onCancel: () => void
  onSaveOnly?: (gym: Omit<Gym, "id" | "joinedDate">) => Promise<void>
  onSuccess?: () => void
  onStep1Success?: () => void
}

export function GymForm({ gym, onSubmit, onCancel, onSaveOnly, onSuccess, onStep1Success }: GymFormProps) {
  return <GymFormMultiStep gym={gym} onSubmit={onSubmit} onCancel={onCancel} onSaveOnly={onSaveOnly} onSuccess={onSuccess} onStep1Success={onStep1Success} />
}
