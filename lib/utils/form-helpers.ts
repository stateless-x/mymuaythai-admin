/**
 * Form Helper Utilities
 * Reusable validation and formatting functions for forms across the application
 */

// ========================
// VALIDATION FUNCTIONS
// ========================

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns boolean - true if valid or empty, false if invalid
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Validates URL format
 * @param url - URL string to validate
 * @returns boolean - true if valid or empty, false if invalid
 */
export const validateUrl = (url: string): boolean => {
  if (!url) return true
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validates required field (not empty after trimming)
 * @param value - String value to validate
 * @returns boolean - true if has content, false if empty
 */
export const validateRequired = (value: string | undefined | null): boolean => {
  return !!(value && value.trim())
}

/**
 * Validates Thai phone number format (9 or 10 digits)
 * @param phone - Phone number string (can contain dashes)
 * @returns boolean - true if valid length, false otherwise
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false
  const digits = phone.replace(/\D/g, '')
  return digits.length === 9 || digits.length === 10
}

// ========================
// FORMATTING FUNCTIONS
// ========================

/**
 * Formats phone number with dashes as user types
 * @param value - Input value from phone field
 * @returns string - Formatted phone number with dashes
 */
export const formatPhoneInput = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')
  
  // Limit to 10 digits
  const limitedDigits = digits.slice(0, 10)
  
  if (limitedDigits.length <= 2) {
    return limitedDigits
  } else if (limitedDigits.length <= 5) {
    return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(2)}`
  } else if (limitedDigits.length <= 8) {
    return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(2, 5)}-${limitedDigits.slice(5)}`
  } else {
    // For 9+ digits, use different format
    if (limitedDigits.length === 9) {
      return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(2, 5)}-${limitedDigits.slice(5)}`
    } else {
      // For 10 digits
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`
    }
  }
}

/**
 * Formats phone number for display in tables/lists
 * @param phone - Raw phone number string
 * @returns string - Formatted phone number or fallback text
 */
export const formatPhoneDisplay = (phone: string | undefined): string => {
  if (!phone) return "ไม่ได้ระบุ"
  
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length === 10) {
    // Format as XXX-XXX-XXXX (e.g., 084-534-4560)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  } else if (digits.length === 9) {
    // Format as XX-XXX-XXXX (e.g., 02-431-2099)
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
  } else {
    // Return original if not 9 or 10 digits
    return phone
  }
}

/**
 * Cleans phone number for API submission (removes all non-digits)
 * @param phone - Phone number string with potential dashes
 * @returns string - Clean digits-only phone number
 */
export const cleanPhoneForAPI = (phone: string): string => {
  return phone.replace(/\D/g, '')
}

/**
 * Truncates long IDs for display
 * @param id - ID string to truncate
 * @returns string - Truncated ID or original if short
 */
export const truncateId = (id: string | undefined): string => {
  if (!id || id.length <= 6) return id || ""
  return `${id.slice(0, 4)}...${id.slice(-2)}`
}

// ========================
// FORM VALIDATION HELPERS
// ========================

/**
 * Creates error messages for form validation
 * @param fieldName - Name of the field for error message
 * @param validationType - Type of validation that failed
 * @returns string - Thai error message
 */
export const getValidationMessage = (fieldName: string, validationType: 'required' | 'email' | 'url' | 'phone'): string => {
  const messages = {
    required: {
      'name_th': 'จำเป็นต้องระบุชื่อภาษาไทย',
      'name_en': 'จำเป็นต้องระบุชื่อภาษาอังกฤษ',
      'phone': 'จำเป็นต้องระบุเบอร์โทรศัพท์',
      'description_th': 'จำเป็นต้องระบุคำอธิบายภาษาไทย',
      'description_en': 'จำเป็นต้องระบุคำอธิบายภาษาอังกฤษ',
      'province_id': 'จำเป็นต้องเลือกจังหวัด',
      'default': 'กรุณากรอกข้อมูลในช่องนี้'
    },
    email: 'กรุณาใส่อีเมลที่ถูกต้อง',
    url: 'กรุณาใส่ URL ที่ถูกต้อง',
    phone: 'กรุณาใส่เบอร์โทรศัพท์ที่ถูกต้อง (9 หรือ 10 หลัก)'
  }

  if (validationType === 'required') {
    return messages.required[fieldName as keyof typeof messages.required] || messages.required.default
  }
  
  return messages[validationType]
}

/**
 * Validates form data and returns errors object
 * @param formData - Form data object to validate
 * @param requiredFields - Array of required field names
 * @returns Record<string, string> - Object with field names as keys and error messages as values
 */
export const validateFormData = (
  formData: Record<string, any>, 
  requiredFields: string[] = []
): Record<string, string> => {
  const errors: Record<string, string> = {}

  // Check required fields
  requiredFields.forEach(field => {
    if (field === 'province_id') {
      // Special validation for province_id (number field)
      if (!formData[field] || !Number.isInteger(formData[field])) {
        errors[field] = getValidationMessage(field, 'required')
      }
    } else {
      // Regular string field validation
      if (!validateRequired(formData[field])) {
        errors[field] = getValidationMessage(field, 'required')
      }
    }
  })

  // Validate email if present
  if (formData.email && !validateEmail(formData.email)) {
    errors.email = getValidationMessage('email', 'email')
  }

  // Validate URLs if present
  if (formData.map_url && !validateUrl(formData.map_url)) {
    errors.map_url = 'กรุณาใส่ URL Google Maps ที่ถูกต้อง'
  }

  if (formData.youtube_url && !validateUrl(formData.youtube_url)) {
    errors.youtube_url = 'กรุณาใส่ URL YouTube ที่ถูกต้อง'
  }

  // Validate phone if present
  if (formData.phone && !validatePhone(formData.phone)) {
    errors.phone = getValidationMessage('phone', 'phone')
  }

  return errors
} 