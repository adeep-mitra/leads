# Chat Interface Components

A functional, reusable chat interface system built for AI assistant interactions.

## Components

### ChatInterface
The main chat component that provides a complete chat experience.

```tsx
import { ChatInterface } from "@/components/chat"

<ChatInterface 
  isOpen={isChatOpen} 
  onClose={() => setIsChatOpen(false)}
  onSendMessage={handleSendMessage} // Optional: Custom message handler
  initialMessages={messages} // Optional: Pre-populate with messages
  className="custom-class" // Optional: Additional styling
/>
```

### Individual Components

- **ChatMessage**: Displays individual chat messages
- **ChatInput**: Input area with send button
- **ChatHeader**: Header with title and close button

## Hook

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

### Basic Usage (Default Behavior)
```tsx
export default function Page() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <div>
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
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
- **Customizable**: Easy to extend and customize for different use cases
- **Error Handling**: Built-in error states and messaging
- **Loading States**: Visual feedback during API calls
- **Responsive**: Works on different screen sizes
- **Accessible**: Keyboard navigation and screen reader support

## Future Enhancements

- Streaming responses
- Message threading
- File attachments
- Message editing and deletion
- Message search and filtering
- Custom themes and styling
- Voice input/output
- Message persistence
