"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Home, Search, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/", icon: Home, label: "Inicio" },
    { href: "/search", icon: Search, label: "Buscar" },
    { href: "/notifications", icon: Bell, label: "Notificaciones" },
]

export function MobileNav() {
    const pathname = usePathname()
    const { data: session } = useSession()

    return (
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
    )
}
