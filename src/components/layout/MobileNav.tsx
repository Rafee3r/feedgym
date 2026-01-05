"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { Home, Search, Bell, User, Bookmark, Settings, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Composer } from "@/components/post/Composer"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const navItems = [
    { href: "/", icon: Home, label: "Inicio" },
    { href: "/search", icon: Search, label: "Buscar" },
    { href: "/notifications", icon: Bell, label: "Notificaciones" },
]

export function MobileNav() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [isComposerOpen, setIsComposerOpen] = useState(false)

    return (
        <>
            {/* Floating Action Button */}
            <button
                className="fab"
                onClick={() => setIsComposerOpen(true)}
                aria-label="Crear publicación"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Compose Dialog */}
            <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
                <DialogContent className="sm:max-w-lg p-0">
                    <DialogHeader className="px-4 pt-4 pb-0">
                        <DialogTitle className="text-lg font-bold">Nueva publicación</DialogTitle>
                    </DialogHeader>
                    <Composer
                        onSuccess={() => setIsComposerOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Bottom Navigation */}
            <nav className="mobile-nav z-50">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            aria-label={item.label}
                        >
                            <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
                        </Link>
                    )
                })}

                {/* Bookmarks */}
                <Link
                    href="/bookmarks"
                    className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                        pathname === "/bookmarks"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Guardados"
                >
                    <Bookmark className={cn("w-6 h-6", pathname === "/bookmarks" && "stroke-[2.5]")} />
                </Link>

                {/* Profile */}
                {session && (
                    <Link
                        href={`/${session.user.username}`}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                            pathname === `/${session.user.username}`
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        aria-label="Perfil"
                    >
                        <User className="w-6 h-6" />
                    </Link>
                )}
            </nav>
        </>
    )
}
