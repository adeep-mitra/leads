"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Megaphone, 
  Database, 
  FileText, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react"

interface SidebarProps {
  className?: string
}

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    href: "/campaigns"
  },
  {
    id: "data",
    label: "Data",
    icon: Database,
    href: "/data"
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    href: "/documents"
  }
]

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState<string>("campaigns")

  return (
    <div 
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border h-full transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-[7.5px] border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">L</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">Leads</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-sidebar-accent"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id
            
            return (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-10 px-3 transition-colors",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "hover:bg-sidebar-accent/50 text-sidebar-foreground",
                    isCollapsed && "justify-center px-0"
                  )}
                  onClick={() => setActiveItem(item.id)}
                >
                  <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {!isCollapsed ? (
          <div className="text-xs text-sidebar-foreground/60 text-center">
            v1.0.0
          </div>
        ) : (
          <div className="w-2 h-2 bg-sidebar-foreground/20 rounded-full mx-auto"></div>
        )}
      </div>
    </div>
  )
}
