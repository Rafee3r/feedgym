"use client"

import React, { useState, useRef } from "react"
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
import { ImageViewer } from "@/components/shared/ImageViewer"

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
    const [isExpanded, setIsExpanded] = useState(false)
    const [viewerImage, setViewerImage] = useState<string | null>(null)

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

    // Parse content and render @mentions with blue color and links
    const renderContentWithMentions = (content: string) => {
        // Match @username patterns (alphanumeric and underscores)
        const mentionRegex = /@([a-zA-Z0-9_]+)/g
        const parts: React.ReactNode[] = []
        let lastIndex = 0
        let match

        while ((match = mentionRegex.exec(content)) !== null) {
            // Add text before the mention
            if (match.index > lastIndex) {
                parts.push(content.slice(lastIndex, match.index))
            }

            const username = match[1]
            // Special case for IRON - no link, just styled
            if (username.toUpperCase() === "IRON") {
                parts.push(
                    <span key={match.index} className="text-blue-500 font-medium">
                        @{username}
                    </span>
                )
            } else {
                parts.push(
                    <Link
                        key={match.index}
                        href={`/${username}`}
                        className="text-blue-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        @{username}
                    </Link>
                )
            }

            lastIndex = match.index + match[0].length
        }

        // Add remaining text after last mention
        if (lastIndex < content.length) {
            parts.push(content.slice(lastIndex))
        }

        return parts.length > 0 ? parts : content
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
                                {post.canDelete && (
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

                    {/* Content Text with Mentions */}
                    <div onClick={() => !isExpanded && !post.content.length && null}>
                        <Link href={`/post/${post.id}`} onClick={(e) => {
                            // If clicking "Reading more", don't navigate
                            // (Handled by the span's onClick, but just in case)
                        }}>
                            <p className="mt-1 text-[15px] whitespace-pre-wrap break-words">
                                {isExpanded || post.content.length <= 280
                                    ? renderContentWithMentions(post.content)
                                    : (
                                        <>
                                            {renderContentWithMentions(post.content.slice(0, 280) + "...")}
                                            <span
                                                className="text-primary font-medium hover:underline cursor-pointer ml-1"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setIsExpanded(true)
                                                }}
                                            >
                                                Leer más
                                            </span>
                                        </>
                                    )
                                }
                            </p>
                        </Link>
                    </div>

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
                        <div className={cn(
                            "mt-3 rounded-xl border border-border p-3",
                            post.isQuote ? "bg-background" : "bg-muted/30"
                        )}>
                            <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={post.repostOf.author.avatarUrl || undefined} />
                                    <AvatarFallback className="text-[10px]">{post.repostOf.author.displayName[0]}</AvatarFallback>
                                </Avatar>
                                <Link href={`/${post.repostOf.author.username}`} className="font-bold text-sm hover:underline">{post.repostOf.author.displayName}</Link>
                                <span className="text-muted-foreground text-xs">@{post.repostOf.author.username}</span>
                                <span className="text-muted-foreground text-xs">· {formatRelativeTime(post.repostOf.createdAt)}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{post.repostOf.content}</p>

                            {/* Repost Media - Images */}
                            {(post.repostOf.mediaUrls && post.repostOf.mediaUrls.length > 0) ? (
                                <div className="mt-2 rounded-lg overflow-hidden relative aspect-video bg-muted">
                                    <Image
                                        src={post.repostOf.mediaUrls[0]}
                                        alt="Repost content"
                                        fill
                                        className="object-cover"
                                    />
                                    {post.repostOf.mediaUrls.length > 1 && (
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                            +{post.repostOf.mediaUrls.length - 1}
                                        </div>
                                    )}
                                </div>
                            ) : post.repostOf.imageUrl && (
                                <div className="mt-2 rounded-lg overflow-hidden relative aspect-video bg-muted">
                                    <Image
                                        src={post.repostOf.imageUrl}
                                        alt="Repost content"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}

                            {/* Repost Audio */}
                            {post.repostOf.metadata?.audioUrl && (
                                <div className="mt-2">
                                    <WhatsAppAudioPlayer src={post.repostOf.metadata.audioUrl} />
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
                            {post.mediaUrls.map((url: string, i: number) => {
                                // Simplified grid logic
                                let spanClass = ""
                                if (post.mediaUrls!.length === 3 && i === 0) spanClass = "row-span-2"
                                if (post.mediaUrls!.length >= 5) {
                                    if (i <= 1) spanClass = "col-span-3 row-span-1"
                                    else spanClass = "col-span-2 row-span-1"
                                }

                                return (
                                    <div
                                        key={i}
                                        className={cn("relative w-full h-full cursor-pointer", spanClass)}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setViewerImage(url)
                                        }}
                                    >
                                        <Image
                                            src={url}
                                            alt={`Post image ${i + 1}`}
                                            fill
                                            className="object-cover hover:opacity-90 transition-opacity"
                                            priority={priority}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    ) : post.imageUrl && (
                        <div
                            className="mt-3 rounded-2xl overflow-hidden border border-border relative aspect-video bg-muted cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setViewerImage(post.imageUrl!)
                            }}
                        >
                            <Image
                                src={post.imageUrl}
                                alt="Post content"
                                fill
                                className="object-cover hover:opacity-90 transition-opacity"
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

            {/* Featured Reply (most liked) - with connecting line */}
            {showThread && post.topReply && (
                <div className="relative ml-[24px] pl-[28px] mt-1">
                    {/* Connecting line */}
                    <div className="absolute left-[20px] top-0 bottom-0 w-[2px] bg-border" />

                    <Link
                        href={`/post/${post.id}`}
                        className="block py-2 hover:bg-accent/20 transition-colors rounded-lg px-2 -mx-2"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={post.topReply.author.avatarUrl || undefined} />
                                <AvatarFallback className="text-[10px]">
                                    {post.topReply.author.displayName?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{post.topReply.author.displayName}</span>
                            <span className="text-xs text-muted-foreground">@{post.topReply.author.username}</span>
                            {post.topReply.likesCount > 0 && (
                                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                                    <Heart className="w-3 h-3 fill-current text-red-500" />
                                    {post.topReply.likesCount}
                                </span>
                            )}
                        </div>
                        <p className="text-sm line-clamp-2 ml-8">
                            {post.topReply.content}
                        </p>

                        {/* Ver más button - shown if there are more replies */}
                        {post.repliesCount > 1 && (
                            <Link
                                href={`/post/${post.id}`}
                                className="ml-8 mt-2 text-sm text-cyan-500 hover:text-cyan-400 hover:underline inline-block"
                            >
                                Ver más ({post.repliesCount - 1} respuestas más)
                            </Link>
                        )}
                    </Link>
                </div>
            )}

            {/* Thread indicator - only show if no topReply and has replies */}
            {showThread && post.repliesCount > 0 && !post.topReply && (
                <div className="ml-[52px] mt-2">
                    <Link
                        href={`/post/${post.id}`}
                        className="text-sm text-cyan-500 hover:text-cyan-400 hover:underline"
                    >
                        Ver hilo ({post.repliesCount} respuestas)
                    </Link>
                </div>
            )}

            {/* Image Viewer Modal */}
            <ImageViewer
                src={viewerImage || ""}
                isOpen={!!viewerImage}
                onClose={() => setViewerImage(null)}
            />
        </article>
    )
}
