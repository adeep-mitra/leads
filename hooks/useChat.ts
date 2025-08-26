"use client"

import { useState, useCallback } from "react"
import type { Message, ChatState, ChatActions } from "@/types/chat"

interface UseChatOptions {
  initialMessages?: Message[]
  onSendMessage?: (content: string) => Promise<Message>
}

export function useChat({ 
  initialMessages = [], 
  onSendMessage 
}: UseChatOptions = {}): ChatState & ChatActions {
  const [chatState, setChatState] = useState<ChatState>({
    messages: initialMessages.length > 0 ? initialMessages : [
    ],
    isLoading: false,
    error: null,
  })

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now(),
      content,
      sender: "user",
      timestamp: new Date(),
    }

    // Add user message immediately
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }))

    try {
      let assistantMessage: Message

      if (onSendMessage) {
        assistantMessage = await onSendMessage(content)
      } else {
        // Default simulation
        await new Promise(resolve => setTimeout(resolve, 1000))
        assistantMessage = {
          id: Date.now() + 1,
          content: "I understand you need help with that. Let me assist you with your coding task.",
          sender: "assistant",
          timestamp: new Date(),
        }
      }

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }))
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "An error occurred",
      }))
    }
  }, [onSendMessage])

  const clearMessages = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: [],
    }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setChatState(prev => ({
      ...prev,
      error,
    }))
  }, [])

  return {
    ...chatState,
    sendMessage,
    clearMessages,
    setError,
  }
}
