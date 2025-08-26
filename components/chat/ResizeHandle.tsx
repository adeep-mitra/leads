import type React from "react"

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void
  direction?: 'left' | 'right'
  className?: string
}

export function ResizeHandle({ 
  onMouseDown, 
  direction = 'left',
  className = "" 
}: ResizeHandleProps) {
  return (
    <div
      className={`absolute top-0 h-full w-2 cursor-col-resize group hover:bg-sidebar-accent/20 transition-colors ${
        direction === 'left' ? '-left-1' : '-right-1'
      } ${className}`}
      onMouseDown={onMouseDown}
    >
      {/* Visual indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-sidebar-border group-hover:bg-sidebar-accent rounded-full transition-colors" />
    </div>
  )
}
