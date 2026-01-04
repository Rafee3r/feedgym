"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/layout/Header"
import { PostCard } from "@/components/post/PostCard"
import { FeedSkeleton } from "@/components/post/PostSkeleton"
import { Bookmark } from "lucide-react"
import type { PostData } from "@/types"

export default function BookmarksPage() {
    const { data: session } = useSession()
    const [posts, setPosts] = useState<PostData[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const response = await fetch("/api/bookmarks")
                if (response.ok) {
                    const data = await response.json()
                    setPosts(data.posts)
                }
            } catch (err) {
                console.error("Error fetching bookmarks:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchBookmarks()
    }, [])

    const handleRemoveBookmark = async (postId: string) => {
        try {
            await fetch(`/api/posts/${postId}/bookmark`, { method: "POST" })
            setPosts((prev) => prev.filter((p) => p.id !== postId))
        } catch (err) {
            console.error("Remove bookmark error:", err)
        }
    }

    return (
        <>
            <Header title="Guardados" />

            {isLoading ? (
                <FeedSkeleton />
            ) : posts.length === 0 ? (
                <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Bookmark className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">Sin posts guardados</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                        Guarda posts para verlos después. Nadie verá lo que guardas.
                    </p>
                </div>
            ) : (
                <div>
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={{ ...post, isBookmarked: true }}
                            currentUserId={session?.user.id}
                            onBookmark={handleRemoveBookmark}
                        />
                    ))}
                </div>
            )}
        </>
    )
}
