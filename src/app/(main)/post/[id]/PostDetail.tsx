"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { PostCard } from "@/components/post/PostCard"
import { Composer } from "@/components/post/Composer"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import type { PostData } from "@/types"

interface PostDetailProps {
    postId: string
}

export function PostDetail({ postId }: PostDetailProps) {
    const { data: session } = useSession()
    const [post, setPost] = useState<PostData | null>(null)
    const [replies, setReplies] = useState<PostData[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchPost = async () => {
        try {
            const response = await fetch(`/api/posts/${postId}`)
            if (response.ok) {
                const data = await response.json()
                setPost(data.post)
                setReplies(data.replies)
            }
        } catch (err) {
            console.error("Error fetching post:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPost()
    }, [postId])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="py-12 text-center">
                <p className="text-muted-foreground">Post no encontrado</p>
            </div>
        )
    }

    return (
        <div>
            {/* Parent Post (if reply) */}
            {post.parent && (
                <>
                    <PostCard post={post.parent as PostData} currentUserId={session?.user.id} />
                    <div className="h-8 w-0.5 bg-border ml-9"></div>
                </>
            )}

            {/* Main Post */}
            <PostCard post={post} currentUserId={session?.user.id} />

            {/* Reply Composer */}
            {session && (
                <>
                    <Separator />
                    <Composer
                        placeholder={`Responder a @${post.author.username}...`}
                        parentId={postId}
                        onSuccess={fetchPost}
                        compact
                    />
                </>
            )}

            {/* Replies */}
            {replies.length > 0 && (
                <>
                    <Separator />
                    <h3 className="px-4 py-3 font-semibold">
                        Respuestas ({replies.length})
                    </h3>
                    {replies.map((reply) => (
                        <PostCard
                            key={reply.id}
                            post={reply}
                            currentUserId={session?.user.id}
                        />
                    ))}
                </>
            )}
        </div>
    )
}
