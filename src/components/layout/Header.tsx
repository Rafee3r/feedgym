"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Dumbbell, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface HeaderProps {
    title?: string
    showBack?: boolean
    sticky?: boolean
}

export function Header({ title, showBack = false, sticky = true }: HeaderProps) {
    const { data: session } = useSession()
    const router = useRouter()

    return (
        <header
            className={`${sticky ? "sticky top-0" : ""
                } z-40 bg-background/95 backdrop-blur-xl border-b border-border supports-[backdrop-filter]:bg-background/85`}
        >
            <div className="flex items-center justify-center gap-4 px-4 h-14 relative">
                {showBack && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full absolute left-4"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                )}

                {/* Desktop/Tablet Title */}
                {title && (
                    <h1 className="text-xl font-bold hidden md:block">{title}</h1>
                )}

                {!title && !showBack && (
                    <h1 className="text-xl font-bold hidden md:block">FeedGym</h1>
                )}

                {/* Mobile Centered Logo */}
                <div className="md:hidden flex items-center">
                    <img src="/logo.png" alt="FeedGym" className="h-10 w-auto object-contain" />
                </div>
            </div>
        </header>
    )
}
