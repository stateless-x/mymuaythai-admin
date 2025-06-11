"use client"

import type React from "react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  id: string
  required?: boolean
  error?: string
  children: React.ReactNode
  description?: string
}

export function FormField({ label, id, required = false, error, children, description }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className={cn("relative", error && "")}>{children}</div>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <span className="text-xs">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function FormInput({ error, className, ...props }: FormInputProps) {
  return (
    <Input
      className={cn(
        "h-9 transition-colors",
        "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        error && "border-red-500 focus:ring-red-500 focus:border-red-500",
        className,
      )}
      {...props}
    />
  )
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function FormTextarea({ error, className, ...props }: FormTextareaProps) {
  return (
    <Textarea
      className={cn(
        "transition-colors resize-none",
        "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        error && "border-red-500 focus:ring-red-500 focus:border-red-500",
        className,
      )}
      {...props}
    />
  )
}
