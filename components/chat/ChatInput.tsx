import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Ask me anything..." 
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSend = () => {
    if (!inputValue.trim() || disabled) return

    onSendMessage(inputValue.trim())
    setInputValue("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t border-sidebar-border bg-sidebar">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-input border-sidebar-border text-sidebar-foreground placeholder:text-muted-foreground"
        />
        <Button
          onClick={handleSend}
          size="sm"
          disabled={disabled || !inputValue.trim()}
          className="bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
