"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { PostCard } from "@/components/post/PostCard"
import { FeedSkeleton } from "@/components/post/PostSkeleton"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import type { PostData, FeedResponse } from "@/types"
import { toast } from "@/hooks/use-toast"

export function Feed() {
    const { data: session } = useSession()
    const [posts, setPosts] = useState<PostData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [nextCursor, setNextCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Pull-to-refresh state
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [pullProgress, setPullProgress] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const touchStartY = useRef(0)
    const isPulling = useRef(false)

    // Infinite scroll sentinel
    const loadMoreRef = useRef<HTMLDivElement>(null)

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

        // Listen for feed refresh requests (e.g. from Composer)
        const handleRefreshEvent = () => {
            fetchPosts()
        }
        window.addEventListener("feed-refresh", handleRefreshEvent)
        return () => window.removeEventListener("feed-refresh", handleRefreshEvent)
    }, [fetchPosts])

    // Infinite scroll with IntersectionObserver
    useEffect(() => {
        if (!loadMoreRef.current || !hasMore || isLoadingMore) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && nextCursor) {
                    handleLoadMore()
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
        )

        observer.observe(loadMoreRef.current)
        return () => observer.disconnect()
    }, [hasMore, isLoadingMore, nextCursor])

    // Pull-to-refresh touch handlers
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                touchStartY.current = e.touches[0].clientY
                isPulling.current = true
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!isPulling.current || window.scrollY > 0) {
                isPulling.current = false
                setPullProgress(0)
                return
            }

            const touchY = e.touches[0].clientY
            const pullDistance = touchY - touchStartY.current

            if (pullDistance > 0 && pullDistance < 150) {
                const progress = Math.min(pullDistance / 100, 1)
                setPullProgress(progress)

                // Prevent default scroll when pulling
                if (progress > 0.1) {
                    e.preventDefault()
                }
            }
        }

        const handleTouchEnd = async () => {
            if (pullProgress >= 1 && !isRefreshing) {
                setIsRefreshing(true)
                await fetchPosts()
                setIsRefreshing(false)
            }
            isPulling.current = false
            setPullProgress(0)
        }

        container.addEventListener("touchstart", handleTouchStart, { passive: true })
        container.addEventListener("touchmove", handleTouchMove, { passive: false })
        container.addEventListener("touchend", handleTouchEnd, { passive: true })

        return () => {
            container.removeEventListener("touchstart", handleTouchStart)
            container.removeEventListener("touchmove", handleTouchMove)
            container.removeEventListener("touchend", handleTouchEnd)
        }
    }, [pullProgress, isRefreshing, fetchPosts])

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
                toast({
                    title: "Post eliminado",
                    description: "El post ha sido eliminado correctamente",
                    variant: "success",
                })
            } else {
                throw new Error("No se pudo eliminar")
            }
        } catch (err) {
            console.error("Delete error:", err)
            toast({
                title: "Error",
                description: "No se pudo eliminar el post. Intenta nuevamente.",
                variant: "destructive",
            })
        }
    }

    const handleRepost = async (postId: string) => {
        try {
            await fetch(`/api/posts/${postId}/repost`, { method: "POST" })
        } catch (err) {
            console.error("Repost error:", err)
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
        <div ref={containerRef} className="relative">
            {/* Pull-to-refresh indicator */}
            {(pullProgress > 0 || isRefreshing) && (
                <div
                    className="absolute left-0 right-0 flex justify-center z-10 transition-transform"
                    style={{
                        top: -50 + (pullProgress * 60),
                        opacity: pullProgress > 0.3 ? 1 : pullProgress * 3
                    }}
                >
                    <div className="bg-background border border-border rounded-full p-2 shadow-lg">
                        <svg
                            className={`w-6 h-6 text-primary ${isRefreshing ? "animate-spin" : ""}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                className="opacity-20"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                strokeDasharray={`${pullProgress * 62.8} 62.8`}
                                strokeLinecap="round"
                                className="origin-center -rotate-90"
                                style={{
                                    transform: isRefreshing ? undefined : "rotate(-90deg)",
                                    transformOrigin: "center"
                                }}
                            />
                        </svg>
                    </div>
                </div>
            )}

            {/* Posts */}
            {posts.map((post, index) => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={session?.user.id}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onDelete={handleDelete}
                    onRepost={handleRepost}
                    showThread
                    priority={index < 2}
                />
            ))}

            {/* Infinite scroll sentinel */}
            {hasMore && (
                <div ref={loadMoreRef} className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Loading more indicator */}
            {isLoadingMore && (
                <div className="py-4 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}

            {/* End of feed */}
            {!hasMore && posts.length > 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                    Has llegado al final 🏋️
                </div>
            )}
        </div>
    )
}
