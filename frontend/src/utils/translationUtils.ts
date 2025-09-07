// Translation utility functions

// Simple language detection based on Unicode ranges
export const detectLanguage = (text: string): string => {
  // Remove whitespace and special characters for analysis
  const cleanText = text.replace(/[^\p{L}]/gu, '')
  
  if (!cleanText) return 'en'
  
  // Check for different script patterns
  const devanagariPattern = /[\u0900-\u097F]/
  const thaiPattern = /[\u0E00-\u0E7F]/
  const chinesePattern = /[\u4E00-\u9FFF]/
  const arabicPattern = /[\u0600-\u06FF]/
  const cyrillicPattern = /[\u0400-\u04FF]/
  
  if (devanagariPattern.test(text)) return 'hi' // Hindi
  if (thaiPattern.test(text)) return 'th' // Thai
  if (chinesePattern.test(text)) return 'zh' // Chinese
  if (arabicPattern.test(text)) return 'ar' // Arabic
  if (cyrillicPattern.test(text)) return 'ru' // Russian
  
  return 'en' // Default to English
}

// Simple translation mapping for common phrases
const translationMap: Record<string, Record<string, string>> = {
  hi: {
    'हेलो': 'Hello',
    'नमस्ते': 'Hello/Greetings',
    'धन्यवाद': 'Thank you',
    'हाँ': 'Yes',
    'नहीं': 'No',
    'कैसे हैं आप?': 'How are you?',
    'मैं ठीक हूँ': 'I am fine'
  },
  th: {
    'อื': 'Uh/Um',
    'สวัสดี': 'Hello',
    'ขอบคุณ': 'Thank you',
    'ใช่': 'Yes',
    'ไม่': 'No'
  }
}

// Get translation for text
export const getTranslation = async (text: string, fromLang: string): Promise<string> => {
  // First try local translation map
  const localTranslation = translationMap[fromLang]?.[text.trim()]
  if (localTranslation) {
    return localTranslation
  }
  
  // For more complex translation, you could integrate with:
  // - Google Translate API
  // - Microsoft Translator
  // - OpenAI API
  // For now, return a placeholder
  
  return `[${text}]` // Fallback: wrap in brackets if no translation found
}

// Main translation function
export const translateToEnglish = async (text: string): Promise<{ 
  original: string, 
  translated: string, 
  language: string,
  needsTranslation: boolean 
}> => {
  const detectedLang = detectLanguage(text)
  const needsTranslation = detectedLang !== 'en'
  
  if (!needsTranslation) {
    return {
      original: text,
      translated: text,
      language: 'en',
      needsTranslation: false
    }
  }
  
  const translated = await getTranslation(text, detectedLang)
  
  return {
    original: text,
    translated,
    language: detectedLang,
    needsTranslation: true
  }
}