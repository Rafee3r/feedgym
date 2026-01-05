"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/post/PostCard"
import { WeightChart } from "./WeightChart"
import { FeedSkeleton } from "@/components/post/PostSkeleton"
import type { PostData } from "@/types"
import { ConsistencyCard, type ActivityData } from "@/components/consistency/ConsistencyCard"

interface ProfileTabsProps {
    username: string
    userId: string
}

export function ProfileTabs({ username, userId }: ProfileTabsProps) {
    const { data: session } = useSession()

    // Posts State
    const [posts, setPosts] = useState<PostData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("posts")

    // Activity Stats State
    const [activityData, setActivityData] = useState<ActivityData | null>(null)
    const [loadingActivity, setLoadingActivity] = useState(true)

    // Media State
    const [mediaPosts, setMediaPosts] = useState<PostData[]>([])
    const [loadingMedia, setLoadingMedia] = useState(false)

    // Replies State
    const [replies, setReplies] = useState<PostData[]>([])
    const [loadingReplies, setLoadingReplies] = useState(false)

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

    const fetchReplies = useCallback(async () => {
        setLoadingReplies(true)
        try {
            const response = await fetch(`/api/posts?userId=${userId}&onlyReplies=true`)
            if (response.ok) {
                const data = await response.json()
                setReplies(data.posts)
            }
        } catch (err) {
            console.error("Error fetching replies:", err)
        } finally {
            setLoadingReplies(false)
        }
    }, [userId])

    const fetchMedia = useCallback(async () => {
        setLoadingMedia(true)
        try {
            const response = await fetch(`/api/posts?userId=${userId}&onlyMedia=true`)
            if (response.ok) {
                const data = await response.json()
                setMediaPosts(data.posts)
            }
        } catch (err) {
            console.error("Error fetching media:", err)
        } finally {
            setLoadingMedia(false)
        }
    }, [userId])

    const fetchActivity = useCallback(async () => {
        setLoadingActivity(true)
        try {
            const response = await fetch(`/api/user/activity?userId=${userId}`)
            if (response.ok) {
                const data = await response.json()
                setActivityData(data)
            }
        } catch (err) {
            console.error("Error fetching activity:", err)
        } finally {
            setLoadingActivity(false)
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
        if (activeTab === "posts") fetchPosts()
        else if (activeTab === "replies") fetchReplies()
        else if (activeTab === "media") fetchMedia()
        else if (activeTab === "stats") fetchActivity()
    }, [activeTab, fetchPosts, fetchReplies, fetchMedia, fetchActivity])

    const isOwnProfile = session?.user.id === userId

    return (
        <Tabs defaultValue="posts" onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0 scrollbar-hide overflow-x-auto">
                {["posts", "replies", "media", "stats"].map((tab) => (
                    <TabsTrigger
                        key={tab}
                        value={tab}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 capitalize"
                    >
                        {tab === "posts" ? "Posts" :
                            tab === "replies" ? "Respuestas" :
                                tab === "media" ? "Media" : "Stats"}
                    </TabsTrigger>
                ))}
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
                {loadingReplies ? (
                    <FeedSkeleton />
                ) : replies.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <p>No hay respuestas todavía</p>
                    </div>
                ) : (
                    replies.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={session?.user.id}
                            onRepost={handleRepost}
                        />
                    ))
                )}
            </TabsContent>

            <TabsContent value="media" className="mt-0">
                {loadingMedia ? (
                    <div className="grid grid-cols-3 gap-1">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="aspect-square bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : mediaPosts.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <p>No hay media todavía</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
                        {mediaPosts.map((post) => {
                            // Prioritize showing image. If multiple media, handle nicely? 
                            // For now just show main image or first media url.
                            const img = post.imageUrl || (post.mediaUrls && post.mediaUrls[0])
                            if (!img) return null
                            return (
                                <div key={post.id} className="relative aspect-square group cursor-pointer overflow-hidden bg-muted">
                                    <img
                                        src={img}
                                        alt="Media"
                                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    {/* Type indicator */}
                                    {post.type === "WORKOUT" && (
                                        <div className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11" /><path d="M6.5 17.5h11" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" /><path d="M6 4v2a6 6 0 0 0 12 0V4" /></svg>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </TabsContent>

            <TabsContent value="stats" className="mt-0 p-4 space-y-6">
                <div className="max-w-md mx-auto">
                    <ConsistencyCard
                        activityData={activityData}
                        isLoading={loadingActivity}
                        userName={username}
                    />
                </div>

                <div className="my-6 border-t border-border" />
                <WeightChart userId={userId} />
            </TabsContent>
        </Tabs>
    )
}
