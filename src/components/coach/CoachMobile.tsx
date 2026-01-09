"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { CoachChat } from "./CoachChat"
import { cn } from "@/lib/utils"

export function CoachMobile() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {/* FAB - Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed right-4 bottom-24 z-40 rounded-full w-14 h-14 shadow-lg",
                    "bg-gradient-to-br from-zinc-700 to-zinc-900 hover:from-zinc-600 hover:to-zinc-800",
                    "flex items-center justify-center text-white",
                    "transition-transform active:scale-95",
                    isOpen && "hidden"
                )}
            >
                <MessageSquare className="w-6 h-6" />
            </button>

            {/* Bottom Sheet */}
            <div
                className={cn(
                    "fixed inset-0 z-50 flex flex-col",
                    "transition-transform duration-300 ease-out",
                    isOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
                )}
            >
                {/* Backdrop */}
                <div
                    className={cn(
                        "absolute inset-0 bg-background/80 backdrop-blur-sm",
                        "transition-opacity duration-300",
                        isOpen ? "opacity-100" : "opacity-0"
                    )}
                    onClick={() => setIsOpen(false)}
                />

                {/* Sheet Content */}
                <div className="relative mt-auto bg-background rounded-t-2xl border-t border-border h-[85vh] flex flex-col overflow-hidden">
                    {/* Handle */}
                    <div className="flex justify-center py-2">
                        <div
                            className="w-12 h-1 rounded-full bg-muted-foreground/30"
                            onClick={() => setIsOpen(false)}
                        />
                    </div>

                    <CoachChat
                        onClose={() => setIsOpen(false)}
                        className="flex-1 overflow-hidden"
                    />
                </div>
            </div>
        </>
    )
}
