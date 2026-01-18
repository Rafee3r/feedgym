"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { Home, Bell, Sparkles, Settings, Plus, Dumbbell } from "lucide-react"
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
    { href: "/cuerpo", icon: Dumbbell, label: "Cuerpo" },
    { href: "/coach", icon: Sparkles, label: "IRON", hasGlow: true },
    { href: "/notifications", icon: Bell, label: "Notificaciones" },
]

import { useUnreadNotifications } from "@/hooks/use-unread-notifications"

export function MobileNav() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [isComposerOpen, setIsComposerOpen] = useState(false)
    const unreadCount = useUnreadNotifications()

    return (
        <>
            {/* Floating Action Button - Only on Feed, not during onboarding */}
            {(pathname === "/" || pathname === "/following") && !pathname.startsWith("/onboarding") && session?.user && (
                <button
                    className="fab"
                    onClick={() => setIsComposerOpen(true)}
                    aria-label="Crear publicación"
                >
                    <Plus className="w-5 h-5" />
                    <span>Publicar</span>
                </button>
            )}

            {/* Compose Dialog */}
            <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
                <DialogContent className="sm:max-w-lg p-0 max-h-[90vh] w-[95vw] rounded-xl">
                    <DialogHeader className="px-4 pt-4 pb-0">
                        <DialogTitle className="text-lg font-bold">Nueva publicación</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[70vh]">
                        <Composer
                            onSuccess={() => setIsComposerOpen(false)}
                            autoFocus={true}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bottom Navigation with PWA Safe Area */}
            <nav
                className="mobile-nav z-50"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            aria-label={item.label}
                        >
                            <div className="relative">
                                <item.icon
                                    className={cn(
                                        "w-6 h-6",
                                        isActive && "stroke-[2.5]",
                                        item.hasGlow && "animate-iron-glow"
                                    )}
                                />
                                {item.label === "Notificaciones" && unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                                )}
                            </div>
                        </Link>
                    )
                })}

                {/* Settings */}
                <Link
                    href="/settings"
                    className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                        pathname.startsWith("/settings")
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Configuración"
                >
                    <Settings className={cn("w-6 h-6", pathname.startsWith("/settings") && "stroke-[2.5]")} />
                </Link>
            </nav>

            {/* IRON glow animation styles */}
            <style jsx global>{`
                @keyframes iron-glow {
                    0%, 75%, 100% {
                        filter: drop-shadow(0 0 0 transparent);
                    }
                    80%, 90% {
                        filter: drop-shadow(0 0 6px hsl(var(--primary)));
                    }
                }
                .animate-iron-glow {
                    animation: iron-glow 4s ease-in-out infinite;
                }
            `}</style>
        </>
    )
}
