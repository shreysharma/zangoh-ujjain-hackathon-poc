export interface Message {
  id: string
  text: string
  image?: string
  isUser: boolean
  timestamp: Date
  audioChunks?: string[]
}

export class MessageStorage {
  private static getStorageKey(pageType: string): string {
    return `messages_${pageType}`
  }

  static getMessages(pageType: string): Message[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.getStorageKey(pageType))
      if (!stored) return []
      
      const parsed = JSON.parse(stored)
      // Convert timestamp strings back to Date objects
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    } catch (error) {
      console.error('Error loading messages from storage:', error)
      return []
    }
  }

  static saveMessages(pageType: string, messages: Message[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.getStorageKey(pageType), JSON.stringify(messages))
    } catch (error) {
      console.error('Error saving messages to storage:', error)
    }
  }

  static addMessage(pageType: string, message: Message): Message[] {
    const messages = this.getMessages(pageType)
    const updatedMessages = [...messages, message]
    this.saveMessages(pageType, updatedMessages)
    return updatedMessages
  }

  static clearMessages(pageType: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.getStorageKey(pageType))
  }

  static clearAllMessages(): void {
    if (typeof window === 'undefined') return
    const keys = ['sarathi', 'rakshak', 'gyankosh']
    keys.forEach(key => this.clearMessages(key))
  }
}