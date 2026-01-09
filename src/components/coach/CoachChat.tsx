"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, X, ImagePlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Message {
    id?: string
    role: "user" | "assistant"
    content: string
    image?: string // base64 image (only stored locally, not in DB)
}

interface CoachChatProps {
    onClose?: () => void
    className?: string
}

export function CoachChat({ onClose, className }: CoachChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Load messages from database on mount
    useEffect(() => {
        async function loadHistory() {
            try {
                const res = await fetch("/api/coach/history")
                if (res.ok) {
                    const data = await res.json()
                    setMessages(data.messages || [])
                }
            } catch (error) {
                console.error("Error loading chat history:", error)
            } finally {
                setIsLoadingHistory(false)
            }
        }
        loadHistory()
    }, [])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto"
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px"
        }
    }, [input])

    // Save message to database
    const saveMessage = async (role: "user" | "assistant", content: string) => {
        try {
            await fetch("/api/coach/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, content })
            })
        } catch (error) {
            console.error("Error saving message:", error)
        }
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if ((!input.trim() && !imagePreview) || isLoading) return

        const userMessage = input.trim()
        const userImage = imagePreview
        setInput("")
        setImagePreview(null)

        const newUserMsg: Message = {
            role: "user",
            content: userMessage || "(imagen adjunta)",
            image: userImage || undefined
        }
        setMessages(prev => [...prev, newUserMsg])
        setIsLoading(true)

        // Save user message to DB (without image - too large)
        saveMessage("user", newUserMsg.content)

        try {
            const response = await fetch("/api/coach/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    image: userImage,
                    conversationHistory: messages.slice(-10),
                }),
            })

            if (!response.ok) throw new Error("Error al enviar mensaje")

            const reader = response.body?.getReader()
            if (!reader) throw new Error("No reader available")

            let assistantMessage = ""
            setMessages(prev => [...prev, { role: "assistant", content: "" }])

            const decoder = new TextDecoder()
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split("\n")

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6)
                        if (data === "[DONE]") continue
                        try {
                            const parsed = JSON.parse(data)
                            if (parsed.content) {
                                assistantMessage += parsed.content
                                setMessages(prev => {
                                    const updated = [...prev]
                                    updated[updated.length - 1] = {
                                        role: "assistant",
                                        content: assistantMessage,
                                    }
                                    return updated
                                })
                            }
                        } catch { }
                    }
                }
            }

            // Save assistant message to DB
            if (assistantMessage) {
                saveMessage("assistant", assistantMessage)
            }
        } catch (error) {
            console.error("Chat error:", error)
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: "Error de conexión. Inténtalo de nuevo." },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const clearHistory = async () => {
        try {
            await fetch("/api/coach/history", { method: "DELETE" })
            setMessages([])
        } catch (error) {
            console.error("Error clearing history:", error)
        }
    }

    if (isLoadingHistory) {
        return (
            <div className={cn("flex flex-col h-full bg-background items-center justify-center", className)}>
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Cargando historial...</p>
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            {/* Header - Dark, minimalist */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-zinc-950">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                        <span className="text-lg font-black text-black">I</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-sm text-white tracking-tight">IRON</h2>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Sin excusas</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearHistory}
                            className="text-xs text-zinc-500 hover:text-white hover:bg-zinc-800"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white hover:bg-zinc-800"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages - ChatGPT style */}
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6">
                            <span className="text-3xl font-black text-black">I</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Soy IRON.</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                            No busco caerte bien. Busco que progreses.
                        </p>
                        <div className="grid gap-2 w-full max-w-xs">
                            {[
                                "Dime la verdad sobre mi progreso",
                                "¿Qué debería mejorar?",
                                "Analiza mis datos"
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => setInput(suggestion)}
                                    className="text-left text-sm px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        {messages.map((msg, i) => (
                            <div
                                key={msg.id || i}
                                className={cn(
                                    "px-4 py-4",
                                    msg.role === "assistant" && "bg-muted/30"
                                )}
                            >
                                <div className="max-w-2xl mx-auto flex gap-4">
                                    {/* Avatar */}
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold",
                                        msg.role === "assistant"
                                            ? "bg-white text-black"
                                            : "bg-primary text-primary-foreground"
                                    )}>
                                        {msg.role === "assistant" ? "I" : "Tú"}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            {msg.role === "assistant" ? "IRON" : "Tú"}
                                        </p>
                                        {msg.image && (
                                            <img
                                                src={msg.image}
                                                alt="Imagen adjunta"
                                                className="max-w-xs rounded-lg mb-2"
                                            />
                                        )}
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                            {msg.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length - 1]?.role === "user" && (
                            <div className="px-4 py-4 bg-muted/30">
                                <div className="max-w-2xl mx-auto flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-black">
                                        I
                                    </div>
                                    <div className="flex items-center gap-1 pt-2">
                                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
                                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse delay-100" />
                                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse delay-200" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input - ChatGPT style */}
            <div className="border-t border-border p-4 bg-background">
                <div className="max-w-2xl mx-auto">
                    {/* Image preview */}
                    {imagePreview && (
                        <div className="mb-3 relative inline-block">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-20 rounded-lg"
                            />
                            <button
                                onClick={() => setImagePreview(null)}
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-muted/50 p-2">
                        {/* Image upload */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <ImagePlus className="w-4 h-4" />
                        </Button>

                        {/* Text input */}
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pregunta sin rodeos..."
                            rows={1}
                            className="flex-1 resize-none bg-transparent border-0 text-sm focus:outline-none focus:ring-0 py-2 max-h-32"
                        />

                        {/* Send button */}
                        <Button
                            type="button"
                            size="icon"
                            onClick={() => handleSubmit()}
                            disabled={(!input.trim() && !imagePreview) || isLoading}
                            className="shrink-0 h-8 w-8 rounded-lg"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                        IRON puede equivocarse. Verifica la información importante.
                    </p>
                </div>
            </div>
        </div>
    )
}
