export interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
  type?: 'text' | 'voice' | 'visual'
  imageData?: string // Base64 image data for visual messages
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}

export interface VoiceState {
  isListening: boolean
  isPlaying: boolean
  transcript: string
}