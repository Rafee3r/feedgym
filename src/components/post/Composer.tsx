"use client"

import { useState, useRef, useTransition } from "react"
import { useSession } from "next-auth/react"
import { Image as ImageIcon, X, Loader2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import type { PostType } from "@/types"

const postTypes: { value: PostType; label: string; emoji: string }[] = [
    { value: "NOTE", label: "Nota", emoji: "📝" },
    { value: "WORKOUT", label: "Entrenamiento", emoji: "🏋️" },
    { value: "PROGRESS", label: "Progreso", emoji: "📈" },
    { value: "PR", label: "Record Personal", emoji: "🏆" },
    { value: "MEAL", label: "Comida", emoji: "🍽️" },
]

interface ComposerProps {
    placeholder?: string
    parentId?: string
    onSuccess?: () => void
    compact?: boolean
}

export function Composer({
    placeholder = "¿Qué estás entrenando?",
    parentId,
    onSuccess,
    compact = false,
}: ComposerProps) {
    const { data: session } = useSession()
    const [content, setContent] = useState("")
    const [postType, setPostType] = useState<PostType>("NOTE")
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [isPending, startTransition] = useTransition()
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const maxLength = 500
    const remaining = maxLength - content.length
    const isOverLimit = remaining < 0

    const handleSubmit = async () => {
        if (!content.trim() || isOverLimit || isPending) return

        startTransition(async () => {
            try {
                const response = await fetch("/api/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: content.trim(),
                        type: postType,
                        imageUrl,
                        parentId,
                    }),
                })

                if (!response.ok) {
                    throw new Error("Error al publicar")
                }

                setContent("")
                setPostType("NOTE")
                setImageUrl(null)
                setIsFocused(false)

                toast({
                    title: "¡Publicado!",
                    description: parentId ? "Tu respuesta ha sido publicada" : "Tu post ha sido publicado",
                    variant: "success",
                })

                onSuccess?.()
            } catch {
                toast({
                    title: "Error",
                    description: "No se pudo publicar. Inténtalo de nuevo.",
                    variant: "destructive",
                })
            }
        })
    }

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value)
        // Auto-resize
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }

    if (!session) return null

    const selectedType = postTypes.find((t) => t.value === postType)

    return (
        <div
            className={cn(
                "border-b border-border px-4 py-3",
                compact ? "py-2" : "py-3"
            )}
        >
            <div className="flex gap-3">
                {/* Avatar */}
                <Avatar className={cn(compact ? "w-8 h-8" : "w-10 h-10 sm:w-12 sm:h-12")}>
                    <AvatarImage src={session.user.image || undefined} />
                    <AvatarFallback>
                        {session.user.name?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>

                {/* Input Area */}
                <div className="flex-1 min-w-0">
                    {/* Post Type Selector */}
                    {(isFocused || content) && !parentId && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1 text-sm text-primary font-medium mb-2 hover:bg-primary/10 px-2 py-1 rounded-full transition-colors">
                                    <span>{selectedType?.emoji}</span>
                                    <span>{selectedType?.label}</span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {postTypes.map((type) => (
                                    <DropdownMenuItem
                                        key={type.value}
                                        onClick={() => setPostType(type.value)}
                                        className={cn(
                                            postType === type.value && "bg-accent"
                                        )}
                                    >
                                        <span className="mr-2">{type.emoji}</span>
                                        {type.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleTextareaChange}
                        onFocus={() => setIsFocused(true)}
                        placeholder={placeholder}
                        className="composer-textarea"
                        rows={compact ? 1 : 2}
                        disabled={isPending}
                    />

                    {/* Image Preview */}
                    {imageUrl && (
                        <div className="relative mt-2 inline-block">
                            <img
                                src={imageUrl}
                                alt="Preview"
                                className="max-h-40 rounded-xl"
                            />
                            <button
                                onClick={() => setImageUrl(null)}
                                className="absolute top-1 right-1 p-1 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    )}

                    {/* Actions */}
                    {(isFocused || content) && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-1">
                                {/* Image Upload (simplified for MVP) */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full text-primary"
                                    title="Añadir imagen"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Character Count */}
                                {content.length > 0 && (
                                    <div
                                        className={cn(
                                            "text-sm",
                                            remaining <= 20 && remaining > 0 && "text-yellow-500",
                                            isOverLimit && "text-destructive"
                                        )}
                                    >
                                        {remaining}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!content.trim() || isOverLimit || isPending}
                                    className="rounded-full px-4"
                                    size="sm"
                                >
                                    {isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : parentId ? (
                                        "Responder"
                                    ) : (
                                        "Publicar"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
