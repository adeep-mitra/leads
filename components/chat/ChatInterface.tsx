"use client"

import React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { ChatHeader } from "./ChatHeader"
import { ResizeHandle } from "./ResizeHandle"
import { useChat } from "@/hooks/useChat"
import { useResizable } from "@/hooks/useResizable"
import type { Message } from "@/types/chat"

interface ChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
  initialMessages?: Message[]
  onSendMessage?: (content: string) => Promise<Message>
  className?: string
  onWidthChange?: (width: number) => void
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
}

export function ChatInterface({ 
  isOpen, 
  onClose, 
  initialMessages = [],
  onSendMessage,
  className = "",
  onWidthChange,
  initialWidth = 320,
  minWidth = 240,
  maxWidth = 800
}: ChatInterfaceProps) {
  const chat = useChat({ initialMessages, onSendMessage })
  const { width, isResizing, startResize, resizeRef } = useResizable({
    initialWidth,
    minWidth,
    maxWidth,
    direction: 'left'
  })

  // Notify parent of width changes
  React.useEffect(() => {
    onWidthChange?.(width)
  }, [width, onWidthChange])

  return (
    <div
      ref={resizeRef}
      className={`fixed right-0 top-0 h-full bg-sidebar border-l border-sidebar-border ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } ${isResizing ? 'transition-none' : 'transition-transform duration-300'} ${className}`}
      style={{ width: `${width}px` }}
    >
      {isOpen && (
        <ResizeHandle onMouseDown={startResize} direction="left" />
      )}
      
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
