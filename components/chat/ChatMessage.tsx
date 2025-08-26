import type React from "react"
import type { Message } from "@/types/chat"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          message.sender === "user"
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "bg-card text-card-foreground border border-sidebar-border"
        }`}
      >
        <p className="leading-relaxed">{message.content}</p>
        <span className="text-xs opacity-70 mt-1 block">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  )
}
