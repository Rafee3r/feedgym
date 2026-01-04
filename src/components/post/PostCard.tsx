"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import {
    Heart,
    MessageCircle,
    Repeat2,
    Bookmark,
    MoreHorizontal,
    Trash2,
    Flag,
    Play,
    Pause,
    Mic,
} from "lucide-react"
import { cn, formatRelativeTime, formatNumber } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FitnessMetadata } from "./FitnessMetadata"
import { PostTypeBadge } from "./PostTypeBadge"
import type { PostData } from "@/types"

function WhatsAppAudioPlayer({ src }: { src: string }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const togglePlay = () => {
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    return (
        <div className="flex items-center gap-3 bg-accent/50 p-3 rounded-lg border border-border mt-3 w-fit pr-6 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl">
            <div className="items-center justify-center flex">
                <button
                    onClick={togglePlay}
                    className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
            </div>
            <div className="flex flex-col gap-1 min-w-[150px]">
                <div className="h-1 bg-primary/20 rounded-full w-full overflow-hidden">
                    <div className={cn("h-full bg-primary transition-all duration-300", isPlaying ? "w-full animate-[pulse_2s_infinite]" : "w-0")} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>{isPlaying ? "Reproduciendo..." : "Audio"}</span>
                </div>
            </div>
            <div className="opacity-50">
                <Mic className="w-5 h-5 text-primary" />
            </div>
            <audio
                ref={audioRef}
                src={src}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                className="hidden"
            />
        </div>
    )
}
// Import useRef inside the PostCard file if not present globally or move this component outside correctly. 
// Note: Since I'm editing a file, `useRef` needs to be imported at the top. I'll fix imports in another step if needed, but I see `useState` is there. `useRef` is missing.


interface PostCardProps {
    post: PostData
    currentUserId?: string
    onLike?: (postId: string) => void
    onBookmark?: (postId: string) => void
    onRepost?: (postId: string) => void
    onDelete?: (postId: string) => void
    showThread?: boolean
    priority?: boolean
}

export function PostCard({
    post,
    currentUserId,
    onLike,
    onBookmark,
    onRepost,
    onDelete,
    showThread = false,
    priority = false, // Add priority prop
}: PostCardProps) {
    const [isLiked, setIsLiked] = useState(post.isLiked || false)
    const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false)
    const [isReposted, setIsReposted] = useState(post.isReposted || false)
    const [likesCount, setLikesCount] = useState(post.likesCount)

    const isOwner = currentUserId === post.author.id

    const handleLike = () => {
        setIsLiked(!isLiked)
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)
        onLike?.(post.id)
    }

    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked)
        onBookmark?.(post.id)
    }

    const handleRepost = () => {
        setIsReposted(!isReposted)
        onRepost?.(post.id)
    }

    return (
        <article className="post-card border-b border-border px-4 py-3">
            <div className="flex gap-3">
                {/* Avatar */}
                <Link href={`/${post.author.username}`} className="shrink-0">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                        <AvatarImage src={post.author.avatarUrl || undefined} />
                        <AvatarFallback>
                            {post.author.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1 flex-wrap text-sm">
                            <Link
                                href={`/${post.author.username}`}
                                className="font-bold hover:underline truncate max-w-[150px] sm:max-w-none"
                            >
                                {post.author.displayName}
                            </Link>
                            <Link
                                href={`/${post.author.username}`}
                                className="text-muted-foreground truncate"
                            >
                                @{post.author.username}
                            </Link>
                            <span className="text-muted-foreground">·</span>
                            <Link
                                href={`/post/${post.id}`}
                                className="text-muted-foreground hover:underline"
                            >
                                {formatRelativeTime(post.createdAt)}
                            </Link>
                        </div>

                        {/* Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full -mt-1"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {isOwner && (
                                    <DropdownMenuItem
                                        onClick={() => onDelete?.(post.id)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </DropdownMenuItem>
                                )}
                                {!isOwner && (
                                    <DropdownMenuItem>
                                        <Flag className="mr-2 h-4 w-4" />
                                        Reportar
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Post Type Badge */}
                    {post.type !== "NOTE" && (
                        <div className="mt-1">
                            <PostTypeBadge type={post.type} />
                        </div>
                    )}

                    {/* Content Text */}
                    <Link href={`/post/${post.id}`}>
                        <p className="mt-1 text-[15px] whitespace-pre-wrap break-words">
                            {post.content}
                        </p>
                    </Link>

                    {/* Voice Note (WhatsApp Style) */}
                    {post.metadata?.audioUrl && (
                        <WhatsAppAudioPlayer src={post.metadata.audioUrl} />
                    )}

                    {/* Fitness Metadata */}
                    {post.metadata && Object.keys(post.metadata).length > 0 && (
                        <FitnessMetadata metadata={post.metadata} />
                    )}

                    {/* Repost/Quote Content */}
                    {post.repostOf && (
                        <div className={cn("mt-3 rounded-xl border border-border p-3", post.isQuote ? "bg-background" : "bg-transparent border-none p-0 mt-0")}>
                            {/* If it's a quote, we show the border/bg. If it's a pure repost, we might want to just show the inner post directly or styled. 
                                Actually, for consistency, let's keep the box but maybe styled differently? 
                                User asked for "reposts showing in profile". 
                                If I just check repostOf, I can render the inner specific card. 
                             */}
                            {/* Recursive PostCard or simplified view? 
                                To avoid infinite recursion issues if data is cyclic (shouldn't be), we usually render a "EmbeddedPost".
                             */}
                            <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={post.repostOf.author.avatarUrl || undefined} />
                                    <AvatarFallback className="text-[10px]">{post.repostOf.author.displayName[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-sm">{post.repostOf.author.displayName}</span>
                                <span className="text-muted-foreground text-xs">@{post.repostOf.author.username}</span>
                                <span className="text-muted-foreground text-xs">· {formatRelativeTime(post.repostOf.createdAt)}</span>
                            </div>
                            <p className="text-sm">{post.repostOf.content}</p>
                            {post.repostOf.imageUrl && (
                                <div className="mt-2 rounded-lg overflow-hidden relative aspect-video bg-muted">
                                    <Image
                                        src={post.repostOf.imageUrl}
                                        alt="Repost content"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Images */}
                    {(post.mediaUrls && post.mediaUrls.length > 0) ? (
                        <div className={cn(
                            "mt-3 grid gap-1 rounded-2xl overflow-hidden border border-border aspect-video bg-muted",
                            post.mediaUrls.length === 1 && "grid-cols-1",
                            post.mediaUrls.length === 2 && "grid-cols-2",
                            post.mediaUrls.length === 3 && "grid-cols-2 grid-rows-2",
                            post.mediaUrls.length === 4 && "grid-cols-2 grid-rows-2",
                            post.mediaUrls.length >= 5 && "grid-cols-6 grid-rows-2", // 2 big, 3 small - simplified common grid
                        )}>
                            {post.mediaUrls.map((url, i) => {
                                // Simplified grid logic
                                let spanClass = ""
                                if (post.mediaUrls!.length === 3 && i === 0) spanClass = "row-span-2"
                                if (post.mediaUrls!.length >= 5) {
                                    if (i <= 1) spanClass = "col-span-3 row-span-1"
                                    else spanClass = "col-span-2 row-span-1"
                                }

                                return (
                                    <div key={i} className={cn("relative w-full h-full", spanClass)}>
                                        <Image
                                            src={url}
                                            alt={`Post image ${i + 1}`}
                                            fill
                                            className="object-cover"
                                            priority={priority}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    ) : post.imageUrl && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-border relative aspect-video bg-muted">
                            <Image
                                src={post.imageUrl}
                                alt="Post content"
                                fill
                                className="object-cover"
                                priority={priority}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    )}

                    {/* Quoted Post */}
                    {post.isQuote && post.repostOf && (
                        <div className="mt-3 border border-border rounded-2xl p-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Avatar className="w-5 h-5">
                                    <AvatarFallback>
                                        {post.repostOf.author.displayName.slice(0, 1)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-foreground">
                                    {post.repostOf.author.displayName}
                                </span>
                                <span>@{post.repostOf.author.username}</span>
                            </div>
                            <p className="mt-1 text-sm line-clamp-3">{post.repostOf.content}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3 -ml-2 max-w-md">
                        {/* Reply */}
                        <Link
                            href={`/post/${post.id}`}
                            className="action-button action-button-reply flex items-center gap-1 group"
                        >
                            <MessageCircle className="w-[18px] h-[18px]" />
                            <span className="text-sm text-muted-foreground group-hover:text-primary">
                                {post.repliesCount > 0 && formatNumber(post.repliesCount)}
                            </span>
                        </Link>

                        {/* Repost */}
                        <button
                            onClick={handleRepost}
                            className={cn(
                                "action-button action-button-repost flex items-center gap-1",
                                isReposted && "reposted"
                            )}
                        >
                            <Repeat2 className="w-[18px] h-[18px]" />
                            <span className="text-sm">
                                {post.repostsCount > 0 && formatNumber(post.repostsCount)}
                            </span>
                        </button>

                        {/* Like */}
                        <button
                            onClick={handleLike}
                            className={cn(
                                "action-button action-button-like flex items-center gap-1",
                                isLiked && "liked"
                            )}
                        >
                            <Heart
                                className={cn("w-[18px] h-[18px]", isLiked && "fill-current")}
                            />
                            <span className="text-sm">
                                {likesCount > 0 && formatNumber(likesCount)}
                            </span>
                        </button>

                        {/* Bookmark */}
                        <button
                            onClick={handleBookmark}
                            className={cn(
                                "action-button action-button-bookmark flex items-center gap-1",
                                isBookmarked && "bookmarked"
                            )}
                        >
                            <Bookmark
                                className={cn(
                                    "w-[18px] h-[18px]",
                                    isBookmarked && "fill-current"
                                )}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Thread indicator */}
            {showThread && post.repliesCount > 0 && (
                <div className="ml-[52px] mt-2">
                    <Link
                        href={`/post/${post.id}`}
                        className="text-sm text-primary hover:underline"
                    >
                        Ver hilo ({post.repliesCount} respuestas)
                    </Link>
                </div>
            )}
        </article>
    )
}
