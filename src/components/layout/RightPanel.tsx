"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { getInitials } from "@/lib/utils"

// Mock data - en producción vendría de la API
const trendingTopics = [
    { tag: "GymLife", posts: 5 },
    { tag: "PRDay", posts: 8 },
    { tag: "LegDay", posts: 3 },
    { tag: "ProgressPics", posts: 9 },
]

const suggestedUsers = [
    {
        id: "1",
        username: "rafesy",
        displayName: "Rafesy",
        avatarUrl: null,
        bio: "Full Stack Dev & Gym Bro 💻💪",
    },
    {
        id: "2",
        username: "tully",
        displayName: "Tully",
        avatarUrl: null,
        bio: "Fitness & Lifestyle ✨",
    },
    {
        id: "3",
        username: "adanmurillo",
        displayName: "Adan Murillo",
        avatarUrl: null,
        bio: "Entrenador Personal 🏋️",
    },
]

export function RightPanel() {
    const { data: session } = useSession()

    if (!session) return null

    return (
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 h-screen sticky top-0 p-4 gap-4">
            {/* Trending */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Tendencias
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {trendingTopics.map((topic) => (
                        <Link
                            key={topic.tag}
                            href={`/search?q=${topic.tag}`}
                            className="block hover:bg-accent/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                        >
                            <p className="font-semibold text-primary">#{topic.tag}</p>
                            <p className="text-sm text-muted-foreground">
                                {topic.posts.toLocaleString()} posts
                            </p>
                        </Link>
                    ))}
                </CardContent>
            </Card>

            {/* Who to Follow */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="w-5 h-5 text-primary" />
                        A quién seguir
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {suggestedUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                            <Link href={`/${user.username}`}>
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={user.avatarUrl || undefined} />
                                    <AvatarFallback>
                                        {getInitials(user.displayName)}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/${user.username}`}
                                    className="font-semibold text-sm hover:underline line-clamp-1"
                                >
                                    {user.displayName}
                                </Link>
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-full">
                                Seguir
                            </Button>
                        </div>
                    ))}
                    <Separator />
                    <Link
                        href="/search?tab=users"
                        className="text-sm text-primary hover:underline"
                    >
                        Ver más
                    </Link>
                </CardContent>
            </Card>

            {/* Footer Links */}
            <div className="text-xs text-muted-foreground space-x-2 px-4">
                <Link href="/terms" className="hover:underline">
                    Términos
                </Link>
                <span>·</span>
                <Link href="/privacy" className="hover:underline">
                    Privacidad
                </Link>
                <span>·</span>
                <Link href="/about" className="hover:underline">
                    Acerca de
                </Link>
                <span>·</span>
                <span>© 2026 FeedGym</span>
            </div>
        </aside>
    )
}
