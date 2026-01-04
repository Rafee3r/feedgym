"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
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

const navItems = [
    { href: "/", icon: Home, label: "Inicio" },
    { href: "/search", icon: Search, label: "Buscar" },
    { href: "/notifications", icon: Bell, label: "Notificaciones" },
    { href: "/bookmarks", icon: Bookmark, label: "Guardados" },
]

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()

    return (
        <aside className="hidden md:flex flex-col w-64 xl:w-72 h-screen sticky top-0 border-r border-border p-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 px-3 py-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold hidden xl:block">FeedGym</span>
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
                                "flex items-center gap-4 px-4 py-3 rounded-full text-lg transition-colors",
                                isActive
                                    ? "font-bold bg-accent"
                                    : "hover:bg-accent/50"
                            )}
                        >
                            <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
                            <span className="hidden xl:block">{item.label}</span>
                        </Link>
                    )
                })}

                {session && (
                    <>
                        <Link
                            href={`/${session.user.username}`}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-full text-lg transition-colors",
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
                                "flex items-center gap-4 px-4 py-3 rounded-full text-lg transition-colors",
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
                                <AvatarImage src={session.user.image || undefined} />
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
                            onClick={() => signOut({ callbackUrl: "/login" })}
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
