"use client"

import { useState, useCallback, useEffect, useRef } from "react"

interface UseResizableOptions {
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
  direction?: 'left' | 'right'
}

export function useResizable({
  initialWidth = 320,
  minWidth = 240,
  maxWidth = 800,
  direction = 'left'
}: UseResizableOptions = {}) {
  const [width, setWidth] = useState(initialWidth)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResize = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const containerRect = resizeRef.current?.getBoundingClientRect()
    if (!containerRect) return

    let newWidth: number
    if (direction === 'left') {
      // For left resize, calculate from the right edge
      newWidth = window.innerWidth - e.clientX
    } else {
      // For right resize, calculate from the left edge
      newWidth = e.clientX - containerRect.left
    }

    // Clamp the width between min and max
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    setWidth(newWidth)
  }, [isResizing, direction, minWidth, maxWidth])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize)
      document.addEventListener('mouseup', stopResize)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', resize)
        document.removeEventListener('mouseup', stopResize)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, resize, stopResize])

  return {
    width,
    isResizing,
    startResize,
    resizeRef,
    setWidth
  }
}
