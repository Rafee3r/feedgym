"use client"

import { useState, useRef, useTransition, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Image as ImageIcon, X, Loader2, ChevronDown, Mic, Square, StopCircle, Play, Trash2 } from "lucide-react"
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
    replyToUsername?: string  // Username to auto-@ when replying
    onSuccess?: () => void
    compact?: boolean
    autoFocus?: boolean
}

// Rotating engaging placeholders
const placeholders = [
    "¿Qué estás entrenando hoy?",
    "Comparte tu progreso del día 💪",
    "¿Cuál fue tu PR esta semana?",
    "¿Qué te motiva a seguir adelante?",
    "Cuenta sobre tu rutina de hoy...",
    "¿Descubriste algo nuevo? ¡Comparte!",
    "¿Cómo va tu transformación?",
    "¿Qué hábito estás construyendo?",
    "¿Qué música te acompaña hoy?",
    "¿Tienes algún tip para la comunidad?",
]

export function Composer({
    placeholder: customPlaceholder,
    parentId,
    replyToUsername,
    onSuccess,
    compact = false,
    autoFocus = false,
}: ComposerProps) {
    const { data: session } = useSession()
    const [content, setContent] = useState("")
    const [postType, setPostType] = useState<PostType>("NOTE")
    const [isFocused, setIsFocused] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [placeholderIndex, setPlaceholderIndex] = useState(() =>
        Math.floor(Math.random() * placeholders.length)
    )

    // Fetch avatar if missing from session (due to base64 stripping)
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(session?.user?.image)
    useEffect(() => {
        if (session?.user) {
            fetch("/api/users/me")
                .then(res => res.json())
                .then(data => {
                    if (data.avatarUrl) {
                        setAvatarUrl(data.avatarUrl)
                    }
                })
                .catch(console.error)
        }
    }, [session])

    // Rotate placeholder every 8 seconds when not focused
    useEffect(() => {
        if (!isFocused && !content) {
            const interval = setInterval(() => {
                setPlaceholderIndex(prev => (prev + 1) % placeholders.length)
            }, 10000)
            return () => clearInterval(interval)
        }
    }, [isFocused, content])

    // Auto-focus logic
    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            // Small timeout to ensure dialog animation/rendering is complete
            setTimeout(() => {
                textareaRef.current?.focus()
                setIsFocused(true)
            }, 100)
        }
    }, [autoFocus])

    // Auto-prefill @username when replying
    useEffect(() => {
        if (replyToUsername && !content) {
            setContent(`@${replyToUsername} `)
        }
    }, [replyToUsername])

    const currentPlaceholder = customPlaceholder || placeholders[placeholderIndex]


    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const chunksRef = useRef<Blob[]>([])

    // No character limit for posts
    const maxLength = 10000
    const remaining = maxLength - content.length
    const isOverLimit = false

    // Draft save/restore from localStorage
    const draftKey = parentId ? `draft-reply-${parentId}` : "draft-post"

    // Restore draft on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(draftKey)
        if (savedDraft && !content && !replyToUsername) {
            setContent(savedDraft)
        }
    }, [draftKey])

    // Save draft when content changes (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (content.trim()) {
                localStorage.setItem(draftKey, content)
            } else {
                localStorage.removeItem(draftKey)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [content, draftKey])

    // Mention autocomplete state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)
    const [mentionSuggestions, setMentionSuggestions] = useState<Array<{ id: string, username: string, displayName: string, avatarUrl: string | null, isBot?: boolean }>>([])
    const [mentionIndex, setMentionIndex] = useState(0)
    const [cursorPosition, setCursorPosition] = useState(0)

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl)
        }
    }, [audioPreviewUrl])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" })
                setAudioBlob(blob)
                setAudioPreviewUrl(URL.createObjectURL(blob))
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)

            // Start timer
            setRecordingTime(0)
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

        } catch (error) {
            console.error("Error accessing microphone:", error)
            toast({
                title: "Error",
                description: "No se pudo acceder al micrófono.",
                variant: "destructive",
            })
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
        setAudioBlob(null)
        setAudioPreviewUrl(null)
        setRecordingTime(0)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const [mediaUrls, setMediaUrls] = useState<string[]>([])

    // Update handlers
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        if (mediaUrls.length + files.length > 5) {
            toast({
                title: "Error",
                description: "Máximo 5 imágenes por post",
                variant: "destructive",
            })
            return
        }

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: "Error", description: `La imagen ${file.name} es muy pesada (max 5MB)`, variant: "destructive" })
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                setMediaUrls(prev => [...prev, reader.result as string])
            }
            reader.readAsDataURL(file)
        })
    }

    const removeImage = (index: number) => {
        setMediaUrls(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if ((!content.trim() && !audioBlob) || isOverLimit || isPending) return

        startTransition(async () => {
            try {
                let finalAudioUrl = undefined

                // Convert audio blob to base64 if exists
                if (audioBlob) {
                    finalAudioUrl = await new Promise<string>((resolve) => {
                        const reader = new FileReader()
                        reader.onloadend = () => resolve(reader.result as string)
                        reader.readAsDataURL(audioBlob)
                    })
                }

                const response = await fetch("/api/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: content.trim(),
                        type: postType,
                        mediaUrls,
                        parentId,
                        metadata: finalAudioUrl ? { audioUrl: finalAudioUrl } : undefined
                    }),
                })

                if (!response.ok) {
                    throw new Error("Error al publicar")
                }

                // Reset state
                setContent("")
                setPostType("NOTE")
                setMediaUrls([])
                setAudioBlob(null)
                setAudioPreviewUrl(null)
                setIsFocused(false)

                toast({
                    title: "¡Publicado!",
                    description: parentId ? "Tu respuesta ha sido publicada" : "Tu post ha sido publicado",
                    variant: "success",
                })

                // Clear draft after successful post
                localStorage.removeItem(draftKey)

                onSuccess?.()

                // Clean refresh of feed
                if (!parentId) {
                    window.dispatchEvent(new Event("feed-refresh"))
                }
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
        const value = e.target.value
        const cursorPos = e.target.selectionStart || 0
        setContent(value)
        setCursorPosition(cursorPos)

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }

        // Check for mention trigger
        const textBeforeCursor = value.slice(0, cursorPos)
        const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/)

        if (mentionMatch) {
            const query = mentionMatch[1]
            setMentionQuery(query)
            setMentionIndex(0)

            // Fetch suggestions
            if (query.length >= 0) {
                fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
                    .then(res => res.json())
                    .then(data => setMentionSuggestions(data.users || []))
                    .catch(() => setMentionSuggestions([]))
            }
        } else {
            setMentionQuery(null)
            setMentionSuggestions([])
        }
    }

    const insertMention = (username: string) => {
        if (mentionQuery === null) return

        const textBeforeMention = content.slice(0, cursorPosition - mentionQuery.length - 1)
        const textAfterCursor = content.slice(cursorPosition)
        const newContent = `${textBeforeMention}@${username} ${textAfterCursor}`

        setContent(newContent)
        setMentionQuery(null)
        setMentionSuggestions([])

        // Focus back on textarea
        setTimeout(() => textareaRef.current?.focus(), 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (mentionSuggestions.length > 0 && mentionQuery !== null) {
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setMentionIndex(prev => Math.min(prev + 1, mentionSuggestions.length - 1))
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setMentionIndex(prev => Math.max(prev - 1, 0))
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault()
                insertMention(mentionSuggestions[mentionIndex].username)
            } else if (e.key === "Escape") {
                setMentionQuery(null)
                setMentionSuggestions([])
            }
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
                <Avatar className={cn(compact ? "w-8 h-8" : "w-10 h-10 sm:w-12 sm:h-12")}>
                    <AvatarImage src={avatarUrl || session.user.image || undefined} />
                    <AvatarFallback>
                        {session.user.name?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    {/* Recording UI Overlay */}
                    {isRecording ? (
                        <div className="flex items-center gap-4 h-12 bg-accent/20 rounded-lg px-4 border border-primary/20 animate-pulse">
                            <div className="flex items-center gap-2 text-primary font-mono font-medium">
                                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                {formatTime(recordingTime)}
                            </div>
                            <div className="flex-1" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelRecording}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                Cancelar
                            </Button>
                            <Button
                                size="icon"
                                onClick={stopRecording}
                                className="bg-primary text-primary-foreground rounded-full h-8 w-8"
                            >
                                <Square className="w-4 h-4 fill-current" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Post Type Selector */}
                            {(isFocused || content || audioBlob) && !parentId && (
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
                                                className={cn(postType === type.value && "bg-accent")}
                                            >
                                                <span className="mr-2">{type.emoji}</span>
                                                {type.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Text Input with Mention Dropdown */}
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={handleTextareaChange}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setIsFocused(true)}
                                    placeholder={audioBlob ? "Añade un comentario a tu audio..." : currentPlaceholder}
                                    className="composer-textarea"
                                    rows={compact ? 1 : 2}
                                    disabled={isPending}
                                />

                                {/* Mention Suggestions Dropdown - Mobile: above, Desktop: below */}
                                {mentionSuggestions.length > 0 && mentionQuery !== null && (
                                    <div className="absolute left-0 right-0 bottom-full mb-1 md:bottom-auto md:top-full md:mt-1 md:mb-0 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-48">
                                        {mentionSuggestions.map((user, idx) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => insertMention(user.username)}
                                                className={cn(
                                                    "flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent transition-colors",
                                                    idx === mentionIndex && "bg-accent"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                    user.isBot ? "bg-white text-black" : "bg-muted"
                                                )}>
                                                    {user.isBot ? "I" : user.displayName[0]?.toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">{user.displayName}</div>
                                                    <div className="text-xs text-muted-foreground">@{user.username}</div>
                                                </div>
                                                {user.isBot && (
                                                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">AI</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Previews */}
                    {mediaUrls.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
                            {mediaUrls.map((url, index) => (
                                <div key={index} className="relative shrink-0">
                                    <img src={url} alt={`Preview ${index}`} className="h-24 w-24 object-cover rounded-md" />
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 p-0.5 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {audioBlob && audioPreviewUrl && !isRecording && (
                        <div className="mt-2 flex items-center gap-3 bg-accent/30 p-2 rounded-xl border border-border max-w-sm">
                            <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-full text-primary">
                                <Mic className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <audio src={audioPreviewUrl} controls className="h-8 w-full" />
                            </div>
                            <button onClick={cancelRecording} className="text-muted-foreground hover:text-destructive p-1">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Actions Toolbar */}
                    {(isFocused || content || audioBlob) && !isRecording && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-1">
                                {/* Image Upload */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full text-primary"
                                    title="Añadir imagen"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </Button>

                                {/* Voice Record */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full text-primary"
                                    title="Grabar voz"
                                    onClick={startRecording}
                                    disabled={!!audioBlob}
                                >
                                    <Mic className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Character counter hidden - no limit */}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={(!content.trim() && !audioBlob) || isOverLimit || isPending}
                                    className="rounded-full px-4"
                                    size="sm"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : parentId ? "Responder" : "Publicar"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
