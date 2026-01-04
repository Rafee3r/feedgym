"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { PostCard } from "@/components/post/PostCard"
import { FeedSkeleton } from "@/components/post/PostSkeleton"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import type { PostData, FeedResponse } from "@/types"

export function Feed() {
    const { data: session } = useSession()
    const [posts, setPosts] = useState<PostData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [nextCursor, setNextCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchPosts = useCallback(async (cursor?: string) => {
        try {
            const url = cursor ? `/api/posts?cursor=${cursor}` : "/api/posts"
            const response = await fetch(url)

            if (!response.ok) {
                throw new Error("Error al cargar posts")
            }

            const data: FeedResponse = await response.json()

            if (cursor) {
                setPosts((prev) => [...prev, ...data.posts])
            } else {
                setPosts(data.posts)
            }

            setNextCursor(data.nextCursor)
            setHasMore(data.hasMore)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido")
        }
    }, [])

    useEffect(() => {
        const load = async () => {
            setIsLoading(true)
            await fetchPosts()
            setIsLoading(false)
        }
        load()
    }, [fetchPosts])

    const handleLoadMore = async () => {
        if (!nextCursor || isLoadingMore) return
        setIsLoadingMore(true)
        await fetchPosts(nextCursor)
        setIsLoadingMore(false)
    }

    const handleRefresh = async () => {
        setIsLoading(true)
        setError(null)
        await fetchPosts()
        setIsLoading(false)
    }

    const handleLike = async (postId: string) => {
        try {
            await fetch(`/api/posts/${postId}/like`, { method: "POST" })
        } catch (err) {
            console.error("Like error:", err)
        }
    }

    const handleBookmark = async (postId: string) => {
        try {
            await fetch(`/api/posts/${postId}/bookmark`, { method: "POST" })
        } catch (err) {
            console.error("Bookmark error:", err)
        }
    }

    const handleDelete = async (postId: string) => {
        try {
            const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
            if (response.ok) {
                setPosts((prev) => prev.filter((p) => p.id !== postId))
            }
        } catch (err) {
            console.error("Delete error:", err)
        }
    }

    if (isLoading) {
        return <FeedSkeleton />
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                </Button>
            </div>
        )
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                    >
                        <path d="M6.5 6.5 17.5 17.5M6.5 17.5 17.5 6.5" />
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Tu feed está vacío</h3>
                <p className="text-muted-foreground max-w-sm">
                    Comparte tu primer entrenamiento o sigue a otros atletas para ver su contenido aquí.
                </p>
            </div>
        )
    }

    return (
        <div>
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={session?.user.id}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onDelete={handleDelete}
                    showThread
                />
            ))}

            {hasMore && (
                <div className="py-4 flex justify-center">
                    <Button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        variant="ghost"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cargando...
                            </>
                        ) : (
                            "Cargar más"
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
