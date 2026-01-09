"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CoachChat } from "./CoachChat"
import { cn } from "@/lib/utils"

interface CoachSidebarProps {
    className?: string
}

export function CoachSidebar({ className }: CoachSidebarProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {/* Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed right-4 bottom-20 z-40 rounded-full w-12 h-12 shadow-lg",
                    "bg-gradient-to-br from-zinc-700 to-zinc-900 hover:from-zinc-600 hover:to-zinc-800",
                    "text-white",
                    isOpen && "hidden"
                )}
            >
                <MessageSquare className="w-5 h-5" />
            </Button>

            {/* Sidebar Panel */}
            <div
                className={cn(
                    "fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-xl z-50",
                    "transition-transform duration-300 ease-out",
                    isOpen ? "translate-x-0" : "translate-x-full",
                    className
                )}
            >
                <CoachChat onClose={() => setIsOpen(false)} />
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    )
}
