"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Send, Loader2, X, ImagePlus, Trash2, Bookmark, Copy, Settings, Star, Download, Upload, Check, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

// Parse basic markdown: **bold**, [text](link), `code`
function renderMarkdown(content: string): React.ReactNode {
    // Split by markdown patterns
    const parts: React.ReactNode[] = []
    let remaining = content
    let key = 0

    // Pattern for: **bold**, [link](url), `code`
    const pattern = /(\*\*(.+?)\*\*)|(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)/g

    let lastIndex = 0
    let match

    while ((match = pattern.exec(content)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index))
        }

        if (match[1]) {
            // Bold: **text**
            parts.push(<strong key={key++} className="font-bold">{match[2]}</strong>)
        } else if (match[3]) {
            // Link: [text](url)
            parts.push(
                <a
                    key={key++}
                    href={match[5]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-500 hover:text-cyan-400 hover:underline"
                >
                    {match[4]}
                </a>
            )
        } else if (match[6]) {
            // Code: `text`
            parts.push(
                <code key={key++} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                    {match[7]}
                </code>
            )
        }

        lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex))
    }

    return parts.length > 0 ? parts : content
}

interface Message {
    id?: string
    role: "user" | "assistant"
    content: string
    image?: string // base64 image (only stored locally, not in DB)
}

interface CoachChatProps {
    onClose?: () => void
    className?: string
    initialMessage?: string
}

export function CoachChat({ onClose, className, initialMessage }: CoachChatProps) {
    const { data: session } = useSession()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)
    const [userAvatarUrl, setUserAvatarUrl] = useState<string | undefined>(session?.user?.image || undefined)
    const [hasAutoSentInitial, setHasAutoSentInitial] = useState(false)
    const [ironAvatarUrl, setIronAvatarUrl] = useState<string | undefined>(undefined)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Favorites and Settings state
    const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set())
    const [showFavorites, setShowFavorites] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [compactMode, setCompactMode] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Load saved messages and settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("iron-saved-messages")
        if (saved) setSavedMessageIds(new Set(JSON.parse(saved)))
        const compact = localStorage.getItem("iron-compact-mode")
        if (compact) setCompactMode(JSON.parse(compact))
    }, [])

    // Fetch avatar if missing from session
    useEffect(() => {
        if (session?.user) {
            fetch("/api/users/me")
                .then(res => res.json())
                .then(data => {
                    if (data.avatarUrl) {
                        setUserAvatarUrl(data.avatarUrl)
                    }
                })
                .catch(console.error)
        }
        // Fetch IRON's avatar
        fetch("/api/users/iron")
            .then(res => res.json())
            .then(data => {
                console.log("IRON profile data:", data)
                if (data.avatarUrl) {
                    setIronAvatarUrl(data.avatarUrl)
                    console.log("IRON avatar URL set:", data.avatarUrl)
                }
            })
            .catch(err => console.error("Failed to fetch IRON avatar:", err))
    }, [session])

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

    // Scroll to bottom on new messages (instant, no animation)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
    }, [messages])

    // Auto-send initial message if provided (from cuerpo page IRON questions)
    useEffect(() => {
        if (initialMessage && !isLoadingHistory && !hasAutoSentInitial && !isLoading) {
            setHasAutoSentInitial(true)
            // Use setTimeout to ensure state is ready
            setTimeout(() => {
                setInput(initialMessage)
                // Trigger submit programmatically
                const submitEvent = new Event('submit', { bubbles: true })
                document.querySelector('form')?.dispatchEvent(submitEvent)
            }, 100)
        }
    }, [initialMessage, isLoadingHistory, hasAutoSentInitial, isLoading])

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
            const response = await fetch("/api/coach/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, content })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error("Error saving message to DB:", response.status, errorData)
            } else {
                console.log(`[CoachChat] Saved ${role} message to DB`)
            }
        } catch (error) {
            console.error("Network error saving message:", error)
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
        await saveMessage("user", newUserMsg.content)

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
                await saveMessage("assistant", assistantMessage)
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

    // Toggle save message
    const toggleSaveMessage = (msgId: string) => {
        const newSaved = new Set(savedMessageIds)
        if (newSaved.has(msgId)) {
            newSaved.delete(msgId)
        } else {
            newSaved.add(msgId)
        }
        setSavedMessageIds(newSaved)
        localStorage.setItem("iron-saved-messages", JSON.stringify([...newSaved]))
    }

    // Copy message content
    const copyMessage = async (content: string, msgId: string) => {
        try {
            await navigator.clipboard.writeText(content)
            setCopiedId(msgId)
            setTimeout(() => setCopiedId(null), 2000)
        } catch {
            toast({ title: "Error al copiar", variant: "destructive" })
        }
    }

    // Export chat
    const exportChat = () => {
        const exportData = {
            exportedAt: new Date().toISOString(),
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                id: m.id
            })),
            savedMessageIds: [...savedMessageIds]
        }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `iron-chat-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({ title: "Chat exportado" })
    }

    // Import chat
    const importChat = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string)
                if (data.messages) {
                    // Note: This only loads to local state, doesn't persist to server
                    toast({ title: "Chat importado (solo lectura)", description: "Los mensajes importados no se guardan en el servidor" })
                }
                if (data.savedMessageIds) {
                    setSavedMessageIds(new Set(data.savedMessageIds))
                    localStorage.setItem("iron-saved-messages", JSON.stringify(data.savedMessageIds))
                }
            } catch {
                toast({ title: "Error al importar", variant: "destructive" })
            }
        }
        reader.readAsText(file)
    }

    // Toggle compact mode
    const toggleCompactMode = () => {
        const newValue = !compactMode
        setCompactMode(newValue)
        localStorage.setItem("iron-compact-mode", JSON.stringify(newValue))
    }

    // Get saved messages
    const savedMessages = messages.filter(m => m.id && savedMessageIds.has(m.id))

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
            {/* Header - Sticky & Safe Area */}
            <div
                className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-border bg-zinc-950"
                style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
            >
                <div className="flex items-center gap-3">
                    {ironAvatarUrl ? (
                        <img
                            src={ironAvatarUrl}
                            alt="IRON"
                            className="w-9 h-9 rounded-lg object-cover"
                            onError={(e) => {
                                console.error("IRON avatar failed to load:", ironAvatarUrl)
                                e.currentTarget.style.display = 'none'
                            }}
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-black text-lg font-black">I</div>
                    )}
                    <div>
                        <h2 className="font-bold text-sm text-white tracking-tight">IRON</h2>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Sin excusas</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {/* Favorites button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowFavorites(!showFavorites); setShowSettings(false) }}
                        className={cn(
                            "text-xs text-zinc-500 hover:text-white hover:bg-zinc-800",
                            showFavorites && "text-yellow-500 bg-zinc-800"
                        )}
                    >
                        <Star className={cn("w-3.5 h-3.5", showFavorites && "fill-current")} />
                        {savedMessageIds.size > 0 && (
                            <span className="ml-1 text-[10px]">{savedMessageIds.size}</span>
                        )}
                    </Button>

                    {/* Settings button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowSettings(!showSettings); setShowFavorites(false) }}
                        className={cn(
                            "text-xs text-zinc-500 hover:text-white hover:bg-zinc-800",
                            showSettings && "text-primary bg-zinc-800"
                        )}
                    >
                        <Settings className="w-3.5 h-3.5" />
                    </Button>

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

            {/* Favorites Panel */}
            {showFavorites && (
                <div className="border-b border-border bg-zinc-900/50 max-h-[40vh] overflow-y-auto">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-yellow-500 flex items-center gap-2">
                                <Star className="w-4 h-4 fill-current" /> Guardados
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowFavorites(false)}>
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        {savedMessages.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No hay mensajes guardados. Usa el icono de bookmark para guardar respuestas de IRON.</p>
                        ) : (
                            <div className="space-y-3">
                                {savedMessages.map((msg) => (
                                    <div key={msg.id} className="bg-zinc-800/50 rounded-lg p-3 text-sm">
                                        <p className="text-muted-foreground line-clamp-3">{msg.content}</p>
                                        <div className="flex gap-2 mt-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => {
                                                    setShowFavorites(false)
                                                    // Find message in DOM and scroll to it
                                                    const el = document.getElementById(`msg-${msg.id}`)
                                                    el?.scrollIntoView({ behavior: "smooth", block: "center" })
                                                }}
                                            >
                                                Ir al mensaje
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => copyMessage(msg.content, msg.id!)}
                                            >
                                                {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Settings Panel */}
            {showSettings && (
                <div className="border-b border-border bg-zinc-900/50 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Configuración
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {/* Compact mode toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Modo compacto</p>
                                <p className="text-xs text-muted-foreground">Ocultar avatares para más espacio</p>
                            </div>
                            <button
                                onClick={toggleCompactMode}
                                className={cn(
                                    "w-10 h-5 rounded-full transition-colors relative",
                                    compactMode ? "bg-primary" : "bg-zinc-600"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                                    compactMode ? "left-5" : "left-0.5"
                                )} />
                            </button>
                        </div>

                        {/* Export/Import */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={exportChat}
                            >
                                <Download className="w-3.5 h-3.5 mr-1" /> Exportar
                            </Button>
                            <label className="flex-1">
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={importChat}
                                />
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                    <span><Upload className="w-3.5 h-3.5 mr-1" /> Importar</span>
                                </Button>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages - ChatGPT style */}
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                        {ironAvatarUrl ? (
                            <img
                                src={ironAvatarUrl}
                                alt="IRON"
                                className="w-16 h-16 rounded-2xl object-cover mb-6"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-black text-3xl font-black mb-6">I</div>
                        )}
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
                                id={msg.id ? `msg-${msg.id}` : undefined}
                                className={cn(
                                    "px-4 py-4 group",
                                    msg.role === "assistant" && "bg-muted/30"
                                )}
                            >
                                <div className="max-w-2xl mx-auto flex gap-4">
                                    {!compactMode && (
                                        msg.role === "assistant" ? (
                                            ironAvatarUrl ? (
                                                <img
                                                    src={ironAvatarUrl}
                                                    alt="IRON"
                                                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black text-xs font-bold flex-shrink-0">I</div>
                                            )
                                        ) : (
                                            <Avatar className="w-8 h-8 rounded-lg flex-shrink-0">
                                                <AvatarImage src={userAvatarUrl} />
                                                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold rounded-lg">
                                                    {getInitials(session?.user?.name || "Tú")}
                                                </AvatarFallback>
                                            </Avatar>
                                        )
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            {msg.role === "assistant" ? "IRON" : "Tú"}
                                        </p>
                                        {msg.image && (
                                            <img
                                                src={msg.image}
                                                alt="Imagen adjunta"
                                                className="max-w-xs max-h-64 object-contain rounded-lg mb-2 bg-black/20"
                                            />
                                        )}
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                            {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                                        </p>

                                        {/* Action icons for assistant messages */}
                                        {msg.role === "assistant" && msg.id && (
                                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => toggleSaveMessage(msg.id!)}
                                                    className={cn(
                                                        "p-1.5 rounded hover:bg-zinc-700 transition-colors",
                                                        savedMessageIds.has(msg.id) ? "text-yellow-500" : "text-muted-foreground"
                                                    )}
                                                    title={savedMessageIds.has(msg.id) ? "Quitar de guardados" : "Guardar mensaje"}
                                                >
                                                    <Bookmark className={cn("w-3.5 h-3.5", savedMessageIds.has(msg.id) && "fill-current")} />
                                                </button>
                                                <button
                                                    onClick={() => copyMessage(msg.content, msg.id!)}
                                                    className="p-1.5 rounded hover:bg-zinc-700 text-muted-foreground transition-colors"
                                                    title="Copiar mensaje"
                                                >
                                                    {copiedId === msg.id ? (
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length - 1]?.role === "user" && (
                            <div className="px-4 py-4 bg-muted/30">
                                <div className="max-w-2xl mx-auto flex gap-4">
                                    {ironAvatarUrl ? (
                                        <img
                                            src={ironAvatarUrl}
                                            alt="IRON"
                                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black text-xs font-bold flex-shrink-0">I</div>
                                    )}
                                    <div className="flex flex-col gap-1 pt-1">
                                        <p className="text-xs font-medium text-muted-foreground">IRON</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground animate-pulse">
                                                {messages[messages.length - 1]?.image
                                                    ? "Procesando imagen..."
                                                    : messages[messages.length - 1]?.content.toLowerCase().match(/(crea|genera|dibuja|imagen|foto|pintura)/)
                                                        ? "Creando imagen..."
                                                        : "Analizando tus datos..."}
                                            </span>
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input - ChatGPT style */}
            <div className="border-t border-border p-4 bg-background pb-20 md:pb-4">
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
