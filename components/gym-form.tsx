"use client"

import { GymFormMultiStep } from "@/components/gym-form-multi-step"
import type { Gym } from "@/lib/types"

interface GymFormProps {
  gym?: Gym
  onSubmit: (gym: Omit<Gym, "id" | "joinedDate">) => void
  onCancel: () => void
}

export function GymForm({ gym, onSubmit, onCancel }: GymFormProps) {
  return <GymFormMultiStep gym={gym} onSubmit={onSubmit} onCancel={onCancel} />
}
