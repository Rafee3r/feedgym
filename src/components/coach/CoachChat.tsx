"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Message {
    role: "user" | "assistant"
    content: string
}

interface CoachChatProps {
    onClose?: () => void
    className?: string
}

export function CoachChat({ onClose, className }: CoachChatProps) {
    const [messages, setMessages] = useState<Message[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("iron-chat-history")
            return saved ? JSON.parse(saved) : []
        }
        return []
    })
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Save messages to localStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("iron-chat-history", JSON.stringify(messages.slice(-50)))
        }
    }, [messages])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput("")
        setMessages(prev => [...prev, { role: "user", content: userMessage }])
        setIsLoading(true)

        try {
            const response = await fetch("/api/coach/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
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

    const clearHistory = () => {
        setMessages([])
        localStorage.removeItem("iron-chat-history")
    }

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm">IRON</h2>
                        <p className="text-xs text-muted-foreground">Coach</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearHistory}
                            className="text-xs text-muted-foreground"
                        >
                            Limpiar
                        </Button>
                    )}
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-sm font-medium">Soy IRON.</p>
                        <p className="text-xs mt-1">Sin rodeos. Sin excusas.</p>
                        <div className="mt-6 space-y-2">
                            <button
                                onClick={() => setInput("¿Cómo voy con mi progreso?")}
                                className="block w-full text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                                ¿Cómo voy con mi progreso?
                            </button>
                            <button
                                onClick={() => setInput("Dame un consejo para hoy")}
                                className="block w-full text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                                Dame un consejo para hoy
                            </button>
                            <button
                                onClick={() => setInput("Revisa mi semana")}
                                className="block w-full text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                                Revisa mi semana
                            </button>
                        </div>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex",
                            msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-muted rounded-bl-sm"
                            )}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe tu mensaje..."
                        rows={1}
                        className="flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
                        style={{ minHeight: "40px" }}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isLoading}
                        className="rounded-xl shrink-0"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
