"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { ChatInterface } from "@/components/chat"
import { Sidebar } from "@/components/sidebar"

export default function HomePage() {
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [chatWidth, setChatWidth] = useState(320)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Workspace */}
      <div 
        className={`flex-1 flex flex-col ${isChatOpen ? 'transition-all duration-300' : 'transition-all duration-300'}`}
        style={{ marginRight: isChatOpen ? `${chatWidth}px` : '0' }}
      >
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

      {/* Chat Interface */}
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onWidthChange={setChatWidth}
        initialWidth={320}
        minWidth={240}
        maxWidth={800}
      />
    </div>
  )
}
