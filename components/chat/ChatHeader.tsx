import type React from "react"
import { Button } from "@/components/ui/button"
import { Bot, ChevronRight } from "lucide-react"

interface ChatHeaderProps {
  onClose: () => void
  title?: string
}

export function ChatHeader({ onClose, title = "AI Assistant" }: ChatHeaderProps) {
  return (
    <div className="h-12 border-b border-sidebar-border flex items-center justify-between px-4 bg-sidebar">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-sidebar-foreground" />
        <span className="font-medium text-sidebar-foreground">{title}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="text-sidebar-foreground hover:bg-sidebar-accent/10"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
