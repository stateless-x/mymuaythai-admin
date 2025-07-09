export const validateEmail = (email: string): boolean => {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validateUrl = (url: string): boolean => {
  if (!url) return true
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const validateRequired = (value: string | undefined | null): boolean => {
  return !!(value && value.trim())
}

export const validatePhone = (phone: string): boolean => {
  if (!phone) return false
  const digits = phone.replace(/\D/g, '')
  return digits.length === 9 || digits.length === 10
}

export const formatPhoneInput = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  const limitedDigits = digits.slice(0, 10)
  if (limitedDigits.length <= 2) {
    return limitedDigits
  } else if (limitedDigits.length <= 5) {
    return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(2)}`
  } else if (limitedDigits.length <= 8) {
    return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(2, 5)}-${limitedDigits.slice(5)}`
  } else {
    if (limitedDigits.length === 9) {
      return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(2, 5)}-${limitedDigits.slice(5)}`
    } else {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`
    }
  }
}

export const formatPhoneDisplay = (phone: string | undefined): string => {
  if (!phone) return "ไม่ได้ระบุ"
  
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  } else if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
  } else {
    return phone
  }
}

export const cleanPhoneForAPI = (phone: string): string => {
  return phone.replace(/\D/g, '')
}

export const truncateId = (id: string | undefined): string => {
  if (!id || id.length <= 6) return id || ""
  return `${id.slice(0, 4)}...${id.slice(-2)}`
}

export const getValidationMessage = (fieldName: string, validationType: 'required' | 'email' | 'url' | 'phone'): string => {
  const messages = {
    required: {
      'name_th': 'จำเป็นต้องระบุชื่อภาษาไทย',
      'name_en': 'จำเป็นต้องระบุชื่อภาษาอังกฤษ',
      'phone': 'จำเป็นต้องระบุเบอร์โทรศัพท์',
      'description_th': 'จำเป็นต้องระบุคำอธิบายภาษาไทย',
      'description_en': 'จำเป็นต้องระบุคำอธิบายภาษาอังกฤษ',
      'province_id': 'จำเป็นต้องเลือกจังหวัด',
      // Trainer form specific fields
      'firstName.th': 'จำเป็นต้องระบุชื่อภาษาไทย',
      'firstName.en': 'จำเป็นต้องระบุชื่อภาษาอังกฤษ',
      'lastName.th': 'จำเป็นต้องระบุนามสกุลภาษาไทย',
      'lastName.en': 'จำเป็นต้องระบุนามสกุลภาษาอังกฤษ',
      'bio.th': 'จำเป็นต้องระบุประวัติภาษาไทย',
      'bio.en': 'จำเป็นต้องระบุประวัติภาษาอังกฤษ',
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


export const validateFormData = (
  formData: Record<string, any>, 
  requiredFields: string[] = []
): Record<string, string> => {
  const errors: Record<string, string> = {}

  requiredFields.forEach(field => {
    if (field === 'province_id') {
      if (!formData[field] || !Number.isInteger(formData[field])) {
        errors[field] = getValidationMessage(field, 'required')
      }
    } else {
      if (!validateRequired(formData[field])) {
        errors[field] = getValidationMessage(field, 'required')
      }
    }
  })

  if (formData.email && !validateEmail(formData.email)) {
    errors.email = getValidationMessage('email', 'email')
  }

  if (formData.map_url && !validateUrl(formData.map_url)) {
    errors.map_url = 'กรุณาใส่ URL Google Maps ที่ถูกต้อง'
  }

  if (formData.youtube_url && !validateUrl(formData.youtube_url)) {
    errors.youtube_url = 'กรุณาใส่ URL YouTube ที่ถูกต้อง'
  }

  if (formData.phone && !validatePhone(formData.phone)) {
    errors.phone = getValidationMessage('phone', 'phone')
  }

  return errors
}

export const trimFormData = <T extends Record<string, any>>(data: T): T => {
  if (data === null || data === undefined) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => trimFormData(item)) as unknown as T
  }

  if (typeof data === 'object' && data !== null) {
    const trimmedData = {} as T
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        trimmedData[key as keyof T] = value.trim() as T[keyof T]
      } else if (typeof value === 'object' && value !== null) {
        trimmedData[key as keyof T] = trimFormData(value) as T[keyof T]
      } else {
        trimmedData[key as keyof T] = value
      }
    }
    
    return trimmedData
  }

  return data
}

export const cleanFormDataForAPI = <T extends Record<string, any>>(data: T): T => {
  const trimmedData = trimFormData(data)
  const cleanedData = { ...trimmedData }
  Object.keys(cleanedData).forEach(key => {
    const value = cleanedData[key]
    if (typeof value === 'string' && value === '') {
      if (['email', 'map_url', 'youtube_url', 'line_id', 'bio_th', 'bio_en'].includes(key)) {
        cleanedData[key as keyof T] = undefined as T[keyof T]
      }
    }
  })
  
  if ('phone' in cleanedData && cleanedData.phone && typeof cleanedData.phone === 'string') {
    (cleanedData as any).phone = cleanPhoneForAPI(cleanedData.phone)
  }
  return cleanedData
} 

export const formatNumberInput = (value: string): Number => {
  const digits = value.replace(/\D/g, '')
  return Number(digits)
}