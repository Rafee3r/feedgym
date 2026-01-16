"use client"

import { useState } from "react"
import { PostCard } from "./PostCard"
import type { PostData } from "@/types"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThreadedReplyProps {
    post: PostData
    currentUserId?: string
    depth?: number
    onLike?: (postId: string) => void
    onBookmark?: (postId: string) => void
    onRepost?: (postId: string) => void
    onDelete?: (postId: string) => void
}

export function ThreadedReply({
    post,
    currentUserId,
    depth = 0,
    onLike,
    onBookmark,
    onRepost,
    onDelete
}: ThreadedReplyProps) {
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    // We only automatically show nested replies up to a certain depth to prevent infinite recursion performance issues
    // But since API only returns 2 levels deep generally, we rely on what's passed.
    const hasReplies = post.replies && post.replies.length > 0
    const totalReplies = post.repliesCount || 0
    const visibleReplies = post.replies?.length || 0
    const remainingReplies = totalReplies - visibleReplies

    // Handler for "View more" could be implemented here if we had an endpoint to fetch just siblings
    // For now it will just link to the single post view
    const handleViewMore = () => {
        window.location.href = `/post/${post.id}`
    }

    return (
        <div className={cn("relative group", depth > 0 && "mt-2")}>
            {/* Visual connector line for current level */}
            {depth > 0 && (
                <div className="absolute -left-4 top-0 w-4 h-6 border-b border-l border-border/40 rounded-bl-xl -z-10" />
            )}

            <PostCard
                post={post}
                currentUserId={currentUserId}
                onLike={onLike}
                onBookmark={onBookmark}
                onRepost={onRepost}
                onDelete={onDelete}
                className={cn(
                    "border-none bg-transparent py-2 pl-0",
                    depth > 0 ? "pr-0" : ""
                )}
            />

            {/* Nested replies container */}
            {hasReplies && (
                <div className="ml-3 pl-3 border-l-2 border-border/30 space-y-1">
                    {post.replies!.map((reply) => (
                        <ThreadedReply
                            key={reply.id}
                            post={reply}
                            currentUserId={currentUserId}
                            depth={depth + 1}
                            onLike={onLike}
                            onBookmark={onBookmark}
                            onRepost={onRepost}
                            onDelete={onDelete}
                        />
                    ))}

                    {remainingReplies > 0 && (
                        <button
                            onClick={handleViewMore}
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-2 pl-2 py-2 transition-colors"
                        >
                            <div className="h-[1px] w-4 bg-border/50" />
                            Ver {remainingReplies} respuestas más...
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
