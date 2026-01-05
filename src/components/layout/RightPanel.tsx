"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { TrendingUp, Users, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { getInitials } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

// Static trending topics (could be dynamic later)
const trendingTopics = [
    { tag: "GymLife", posts: 5 },
    { tag: "PRDay", posts: 8 },
    { tag: "LegDay", posts: 3 },
    { tag: "ProgressPics", posts: 9 },
]

interface SuggestedUser {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isFollowing: boolean
}

export function RightPanel() {
    const { data: session } = useSession()
    const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [followingLoading, setFollowingLoading] = useState<string | null>(null)

    // Fetch suggested users from API
    const fetchSuggestedUsers = useCallback(async () => {
        try {
            const response = await fetch("/api/users/suggested")
            if (response.ok) {
                const data = await response.json()
                setSuggestedUsers(data)
            }
        } catch (error) {
            console.error("Error fetching suggested users:", error)
        } finally {
            setLoadingUsers(false)
        }
    }, [])

    useEffect(() => {
        if (session) {
            fetchSuggestedUsers()
        }
    }, [session, fetchSuggestedUsers])

    // Handle follow/unfollow
    const handleFollow = async (username: string) => {
        setFollowingLoading(username)
        try {
            const response = await fetch(`/api/users/${username}/follow`, {
                method: "POST",
            })

            if (response.ok) {
                const data = await response.json()
                // Update local state
                setSuggestedUsers(prev =>
                    prev.map(user =>
                        user.username === username
                            ? { ...user, isFollowing: data.following }
                            : user
                    )
                )
                toast({
                    title: data.following ? "¡Siguiendo!" : "Dejaste de seguir",
                    description: data.following
                        ? `Ahora sigues a @${username}`
                        : `Ya no sigues a @${username}`,
                })
            } else {
                const error = await response.json()
                toast({
                    title: "Error",
                    description: error.error || "No se pudo completar la acción",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Follow error:", error)
            toast({
                title: "Error",
                description: "Error de conexión",
                variant: "destructive",
            })
        } finally {
            setFollowingLoading(null)
        }
    }

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
                            href={`/search?q=%23${topic.tag}`}
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
                    {loadingUsers ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : suggestedUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No hay sugerencias disponibles
                        </p>
                    ) : (
                        suggestedUsers.map((user) => (
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
                                <Button
                                    variant={user.isFollowing ? "secondary" : "outline"}
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => handleFollow(user.username)}
                                    disabled={followingLoading === user.username}
                                >
                                    {followingLoading === user.username ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : user.isFollowing ? (
                                        "Siguiendo"
                                    ) : (
                                        "Seguir"
                                    )}
                                </Button>
                            </div>
                        ))
                    )}
                    <Separator />
                    <Link
                        href="/search?q=&tab=users"
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
