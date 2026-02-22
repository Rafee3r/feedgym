"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { ArrowLeft, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter, usePathname } from "next/navigation"
import { getInitials } from "@/lib/utils"

interface HeaderProps {
    title?: string
    showBack?: boolean
    sticky?: boolean
}

export function Header({ title, showBack = false, sticky = true }: HeaderProps) {
    const { data: session } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const { resolvedTheme } = useTheme()

    // Fetch avatar if missing from session (base64 images are stripped)
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(session?.user?.image || undefined)
    useEffect(() => {
        if (session?.user) {
            fetch("/api/users/me")
                .then(res => res.json())
                .then(data => {
                    if (data.avatarUrl) {
                        setAvatarUrl(data.avatarUrl)
                    }
                })
                .catch(console.error)
        }
    }, [session])

    const logoSrc = resolvedTheme === "light" ? "/logo-light.png" : "/logo-dark.png"

    return (
        <header
            className={`${sticky ? "sticky top-0" : ""
                } z-40 bg-background/95 backdrop-blur-xl border-b border-border supports-[backdrop-filter]:bg-background/85 pt-[env(safe-area-inset-top,0px)] md:pt-0`}
        >
            <div className="flex items-center justify-between gap-4 px-4 h-14">
                {/* Left side — avatar (mobile) or back button */}
                <div className="w-10 flex-shrink-0 flex items-center">
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
                    ) : session?.user ? (
                        <Link href={`/${session.user.username}`} className="md:hidden">
                            <Avatar className="w-9 h-9 border-2 border-primary/20">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="text-xs">
                                    {getInitials(session.user.name || "U")}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                    ) : null}
                </div>

                {/* Center — title or logo */}
                <div className="flex-1 flex justify-center">
                    {title ? (
                        <h1 className="text-xl font-bold truncate">{title}</h1>
                    ) : (
                        <>
                            <h1 className="text-xl font-bold hidden md:block">FeedGym</h1>
                            <div className="md:hidden">
                                <img src={logoSrc} alt="FeedGym" className="h-10 w-auto object-contain" />
                            </div>
                        </>
                    )}
                </div>

                {/* Right side — notifications bell (mobile) */}
                <div className="w-10 flex-shrink-0 flex justify-end">
                    <Link
                        href="/notifications"
                        className={`md:hidden p-2 rounded-full hover:bg-accent transition-colors relative ${pathname === "/notifications" ? "text-primary" : "text-muted-foreground"}`}
                        aria-label="Notificaciones"
                    >
                        <Bell className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </header>
    )
}
