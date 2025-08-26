"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { ChatInterface } from "@/components/chat"
import { chatService } from "@/lib/chatService"
import type { Message } from "@/types/chat"

export default function ExampleWithApiPage() {
  const [isChatOpen, setIsChatOpen] = useState(true)

  // Example of how to handle messages with an API call
  const handleSendMessage = async (content: string): Promise<Message> => {
    try {
      // This would call your actual API
      const response = await chatService.sendMessage(content)
      return response
    } catch (error) {
      // Handle error and return error message
      return {
        id: Date.now(),
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "assistant",
        timestamp: new Date(),
      }
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Workspace */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isChatOpen ? "mr-80" : "mr-0"}`}>
        {/* Top Toolbar */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">leads - API Example</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(!isChatOpen)}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Chat with API Integration</h1>
            <p className="text-muted-foreground mb-4">
              This example shows how to integrate the chat component with an API service.
            </p>
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Custom message handling with API integration</li>
                <li>Error handling and fallback responses</li>
                <li>Loading states and typing indicators</li>
                <li>Reusable chat service</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface with API integration */}
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
