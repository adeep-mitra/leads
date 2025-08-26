# Chat Interface Components

A functional, reusable chat interface system built for AI assistant interactions with resizable functionality.

## Components

### ChatInterface
The main chat component that provides a complete chat experience with resizable width.

```tsx
import { ChatInterface } from "@/components/chat"

<ChatInterface 
  isOpen={isChatOpen} 
  onClose={() => setIsChatOpen(false)}
  onSendMessage={handleSendMessage} // Optional: Custom message handler
  initialMessages={messages} // Optional: Pre-populate with messages
  className="custom-class" // Optional: Additional styling
  onWidthChange={setChatWidth} // Optional: Handle width changes
  initialWidth={320} // Optional: Initial width (default: 320px)
  minWidth={240} // Optional: Minimum width (default: 240px)
  maxWidth={800} // Optional: Maximum width (default: 800px)
/>
```

### Individual Components

- **ChatMessage**: Displays individual chat messages
- **ChatInput**: Input area with send button
- **ChatHeader**: Header with title and close button
- **ResizeHandle**: Draggable handle for resizing the chat window

## Hooks

### useChat
A custom hook that manages chat state and provides actions.

```tsx
import { useChat } from "@/hooks/useChat"

const chat = useChat({
  initialMessages: [], // Optional
  onSendMessage: async (content) => {
    // Custom message handling
    return assistantMessage
  }
})

// Available properties and methods:
// chat.messages - Array of messages
// chat.isLoading - Loading state
// chat.error - Error message
// chat.sendMessage(content) - Send a message
// chat.clearMessages() - Clear all messages
// chat.setError(error) - Set error state
```

### useResizable
A custom hook for handling resizable functionality.

```tsx
import { useResizable } from "@/hooks/useResizable"

const { width, isResizing, startResize, resizeRef } = useResizable({
  initialWidth: 320, // Optional: Initial width
  minWidth: 240, // Optional: Minimum width
  maxWidth: 800, // Optional: Maximum width
  direction: 'left' // Optional: Resize direction ('left' | 'right')
})
```

## Service

### ChatService
A service class for handling API interactions.

```tsx
import { chatService } from "@/lib/chatService"

// Send a message
const response = await chatService.sendMessage("Hello!")

// Custom service instance
const customService = new ChatService("/api/custom", "api-key")
```

## Types

```tsx
interface Message {
  id: number
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

interface ChatState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}
```

## Usage Examples

### With Resizable Width
```tsx
export default function Page() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatWidth, setChatWidth] = useState(320)

  return (
    <div className="flex h-screen">
      <div 
        className="flex-1"
        style={{ marginRight: isChatOpen ? `${chatWidth}px` : '0' }}
      >
        {/* Main content */}
      </div>
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onWidthChange={setChatWidth}
        initialWidth={320}
        minWidth={240}
        maxWidth={600}
      />
    </div>
  )
}
```

### With Custom API Integration
```tsx
export default function Page() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const handleSendMessage = async (content: string): Promise<Message> => {
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: content })
    })
    const data = await response.json()
    
    return {
      id: Date.now(),
      content: data.response,
      sender: "assistant",
      timestamp: new Date()
    }
  }

  return (
    <div>
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
```

### Using the Hook Directly
```tsx
export default function CustomChat() {
  const chat = useChat({
    onSendMessage: async (content) => {
      // Custom logic here
      return assistantResponse
    }
  })

  return (
    <div>
      {chat.messages.map(message => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <ChatInput 
        onSendMessage={chat.sendMessage} 
        disabled={chat.isLoading} 
      />
    </div>
  )
}
```

## Features

- **Modular Design**: Components can be used individually or together
- **TypeScript Support**: Full type safety with comprehensive interfaces
- **Resizable Interface**: Drag the left border to resize the chat window
- **Customizable**: Easy to extend and customize for different use cases
- **Error Handling**: Built-in error states and messaging
- **Loading States**: Visual feedback during API calls
- **Responsive**: Works on different screen sizes
- **Accessible**: Keyboard navigation and screen reader support

## Resizing Behavior

- **Default Width**: 320px
- **Minimum Width**: 240px (configurable)
- **Maximum Width**: 800px (configurable)
- **Resize Handle**: Visual indicator on the left border
- **Smooth Transitions**: Animated resize with visual feedback
- **Parent Notification**: Automatically notifies parent components of width changes

## Future Enhancements

- Streaming responses
- Message threading
- File attachments
- Message editing and deletion
- Message search and filtering
- Custom themes and styling
- Voice input/output
- Message persistence
