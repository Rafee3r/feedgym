"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import {
    Home,
    Search,
    Bell,
    Bookmark,
    User,
    Settings,
    LogOut,
    Dumbbell,
    MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getInitials } from "@/lib/utils"

import { useUnreadNotifications } from "@/hooks/use-unread-notifications"

const navItems = [
    { href: "/", icon: Home, label: "Inicio" },
    { href: "/search", icon: Search, label: "Buscar" },
    { href: "/notifications", icon: Bell, label: "Notificaciones" },
    { href: "/bookmarks", icon: Bookmark, label: "Guardados" },
]

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const unreadCount = useUnreadNotifications()

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    useEffect(() => {
        if (session?.user) {
            setAvatarUrl(session.user.image || null)

            // Fetch fresh data
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

    return (
        <aside className="hidden md:flex flex-col w-64 xl:w-72 h-screen sticky top-0 border-r border-border p-4">
            {/* Logo */}
            {/* Logo */}
            <Link href="/" className="flex items-center gap-4 px-4 py-4 mb-2 group transition-colors">
                <img src="/logo.png" alt="FeedGym" className="h-10 w-auto hidden xl:block object-contain" />
                <img src="/icon.png" alt="FeedGym" className="h-10 w-10 xl:hidden object-contain" />
            </Link>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-6 py-3 rounded-full text-lg transition-colors relative",
                                isActive
                                    ? "font-bold bg-accent"
                                    : "hover:bg-accent/50"
                            )}
                        >
                            <div className="relative">
                                <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
                                {item.label === "Notificaciones" && unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                                )}
                            </div>
                            <span className="hidden xl:block">{item.label}</span>
                        </Link>
                    )
                })}

                {session && (
                    <>
                        <Link
                            href={`/${session.user.username}`}
                            className={cn(
                                "flex items-center gap-4 px-6 py-3 rounded-full text-lg transition-colors",
                                pathname === `/${session.user.username}`
                                    ? "font-bold bg-accent"
                                    : "hover:bg-accent/50"
                            )}
                        >
                            <User className="w-6 h-6" />
                            <span className="hidden xl:block">Perfil</span>
                        </Link>

                        <Link
                            href="/settings"
                            className={cn(
                                "flex items-center gap-4 px-6 py-3 rounded-full text-lg transition-colors",
                                pathname.startsWith("/settings")
                                    ? "font-bold bg-accent"
                                    : "hover:bg-accent/50"
                            )}
                        >
                            <Settings className="w-6 h-6" />
                            <span className="hidden xl:block">Configuración</span>
                        </Link>
                    </>
                )}
            </nav>

            {/* Post Button */}
            <Button size="xl" className="w-full rounded-full my-4 hidden xl:flex">
                Publicar
            </Button>
            <Button size="icon" className="w-12 h-12 rounded-full my-4 xl:hidden mx-auto">
                <Dumbbell className="w-6 h-6" />
            </Button>

            {/* User Menu */}
            {session && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 p-3 rounded-full hover:bg-accent/50 transition-colors w-full">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={avatarUrl || session.user.image || undefined} />
                                <AvatarFallback>
                                    {getInitials(session.user.name || "U")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left hidden xl:block">
                                <p className="font-semibold text-sm line-clamp-1">
                                    {session.user.name}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    @{session.user.username}
                                </p>
                            </div>
                            <MoreHorizontal className="w-5 h-5 hidden xl:block" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild>
                            <Link href={`/${session.user.username}`}>
                                <User className="mr-2 h-4 w-4" />
                                Ver perfil
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                Configuración
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => signOut({ callbackUrl: window.location.origin + "/login" })}
                            className="text-destructive focus:text-destructive"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </aside>
    )
}
