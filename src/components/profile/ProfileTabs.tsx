"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/post/PostCard"
import { WeightChart } from "./WeightChart"
import { FeedSkeleton, PostSkeleton } from "@/components/post/PostSkeleton"
import type { PostData } from "@/types"

interface ProfileTabsProps {
    username: string
    userId: string
}

export function ProfileTabs({ username, userId }: ProfileTabsProps) {
    const { data: session } = useSession()
    const [posts, setPosts] = useState<PostData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("posts")

    const fetchPosts = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/posts?userId=${userId}`)
            if (response.ok) {
                const data = await response.json()
                setPosts(data.posts)
            }
        } catch (err) {
            console.error("Error fetching posts:", err)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    const handleRepost = async (postId: string) => {
        try {
            await fetch(`/api/posts/${postId}/repost`, { method: "POST" })
        } catch (err) {
            console.error("Repost error:", err)
        }
    }

    useEffect(() => {
        if (activeTab === "posts") {
            fetchPosts()
        }
    }, [activeTab, fetchPosts])

    const isOwnProfile = session?.user.id === userId

    return (
        <Tabs defaultValue="posts" onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0">
                <TabsTrigger
                    value="posts"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                    Posts
                </TabsTrigger>
                <TabsTrigger
                    value="replies"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                    Respuestas
                </TabsTrigger>
                <TabsTrigger
                    value="media"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                    Media
                </TabsTrigger>
                {isOwnProfile && (
                    <TabsTrigger
                        value="stats"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                    >
                        Stats
                    </TabsTrigger>
                )}
            </TabsList>

            <TabsContent value="posts" className="mt-0">
                {isLoading ? (
                    <FeedSkeleton />
                ) : posts.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <p>No hay posts todavía</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={session?.user.id}
                            onRepost={handleRepost}
                        />
                    ))
                )}
            </TabsContent>

            <TabsContent value="replies" className="mt-0">
                <div className="py-12 text-center text-muted-foreground">
                    <p>No hay respuestas todavía</p>
                </div>
            </TabsContent>

            <TabsContent value="media" className="mt-0">
                <div className="py-12 text-center text-muted-foreground">
                    <p>No hay media todavía</p>
                </div>
            </TabsContent>

            {isOwnProfile && (
                <TabsContent value="stats" className="mt-0 p-4">
                    <WeightChart />
                </TabsContent>
            )}
        </Tabs>
    )
}
