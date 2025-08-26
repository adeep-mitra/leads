"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Code, FileText, Settings, ChevronRight } from "lucide-react"

interface Message {
  id: number
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

export default function CursorInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! I'm your AI coding assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isChatOpen, setIsChatOpen] = useState(true)

  const sendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: messages.length + 1,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setInputValue("")

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: messages.length + 2,
        content: "I understand you need help with that. Let me assist you with your coding task.",
        sender: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Workspace */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isChatOpen ? "mr-80" : "mr-0"}`}>
        {/* Top Toolbar */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">leads</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(!isChatOpen)}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-sidebar border-l border-sidebar-border transition-transform duration-300 ${
          isChatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Chat Header */}
        <div className="h-12 border-b border-sidebar-border flex items-center justify-between px-4 bg-sidebar">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-sidebar-accent" />
            <span className="font-medium text-sidebar-foreground">AI Assistant</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsChatOpen(false)}
            className="text-sidebar-foreground hover:bg-sidebar-accent/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
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
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 bg-input border-sidebar-border text-sidebar-foreground placeholder:text-muted-foreground"
            />
            <Button
              onClick={sendMessage}
              size="sm"
              className="bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
