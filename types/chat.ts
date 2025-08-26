export interface Message {
  id: number
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}

export interface ChatActions {
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  setError: (error: string | null) => void
}
