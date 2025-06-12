"use client"

import { GymFormMultiStep } from "@/components/gym-form-multi-step"
import type { Gym } from "@/lib/types"

interface GymFormProps {
  gym?: Gym
  onSubmit: (gym: Omit<Gym, "id" | "joinedDate">) => void
  onCancel: () => void
  onSaveOnly?: (gym: Omit<Gym, "id" | "joinedDate">) => Promise<void>
}

export function GymForm({ gym, onSubmit, onCancel, onSaveOnly }: GymFormProps) {
  return <GymFormMultiStep gym={gym} onSubmit={onSubmit} onCancel={onCancel} onSaveOnly={onSaveOnly} />
}
