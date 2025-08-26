"use client"

import type React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { ChatHeader } from "./ChatHeader"
import { useChat } from "@/hooks/useChat"
import type { Message } from "@/types/chat"

interface ChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
  initialMessages?: Message[]
  onSendMessage?: (content: string) => Promise<Message>
  className?: string
}

export function ChatInterface({ 
  isOpen, 
  onClose, 
  initialMessages = [],
  onSendMessage,
  className = ""
}: ChatInterfaceProps) {
  const chat = useChat({ initialMessages, onSendMessage })

  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-sidebar border-l border-sidebar-border transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } ${className}`}
    >
      <ChatHeader onClose={onClose} />

      {/* Messages Area */}
      <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
        <div className="p-4 space-y-4">
          {chat.messages.map((message: Message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {chat.isLoading && (
            <div className="flex justify-start">
              <div className="bg-card text-card-foreground border border-sidebar-border rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-sidebar-accent rounded-full animate-pulse" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {chat.error && (
            <div className="flex justify-center">
              <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-3 py-2 text-sm">
                <p>{chat.error}</p>
                <button 
                  onClick={() => chat.setError(null)}
                  className="text-xs underline mt-1 hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <ChatInput 
        onSendMessage={chat.sendMessage} 
        disabled={chat.isLoading}
      />
    </div>
  )
}
