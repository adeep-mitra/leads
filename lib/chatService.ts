import type { Message } from "@/types/chat"

/**
 * Chat service for handling AI assistant interactions
 * This service can be connected to various AI providers or APIs
 */
export class ChatService {
  private baseUrl: string
  private apiKey?: string

  constructor(baseUrl: string = "/api/chat", apiKey?: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  /**
   * Send a message to the AI assistant and get a response
   */
  async sendMessage(content: string, context?: any): Promise<Message> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({
          message: content,
          context,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        id: Date.now(),
        content: data.response || data.message || "Sorry, I couldn't process your request.",
        sender: "assistant",
        timestamp: new Date(),
      }
    } catch (error) {
      console.error("Chat service error:", error)
      throw new Error("Failed to get response from AI assistant")
    }
  }

  /**
   * Stream a response from the AI assistant (for future implementation)
   */
  async streamMessage(content: string, onChunk: (chunk: string) => void): Promise<void> {
    // This would implement streaming responses
    // For now, just simulate streaming
    const fullResponse = "This is a simulated streaming response that appears gradually."
    const words = fullResponse.split(" ")
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      onChunk(words.slice(0, i + 1).join(" "))
    }
  }
}

// Default instance
export const chatService = new ChatService()
