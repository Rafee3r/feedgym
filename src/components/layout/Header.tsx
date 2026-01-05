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
                } z-40 bg-background/80 backdrop-blur-sm border-b border-border`}
        >
            <div className="flex items-center gap-4 px-4 h-14">
                {showBack ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                ) : (
                    <Link href="/" className="md:hidden">
                        <img src="/icon.png" alt="FeedGym" className="h-8 w-8 object-contain" />
                    </Link>
                )}

                {/* Desktop/Tablet Title */}
                {title && (
                    <h1 className="text-xl font-bold hidden md:block">{title}</h1>
                )}

                {!title && !showBack && (
                    <h1 className="text-xl font-bold hidden md:block">FeedGym</h1>
                )}

                {/* Mobile Centered Logo */}
                <div className="md:hidden absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <img src="/logo.png" alt="FeedGym" className="h-6 w-auto object-contain" />
                </div>
            </div>
        </header>
    )
}
