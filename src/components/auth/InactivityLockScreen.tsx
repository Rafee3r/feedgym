"use client"

import { useState, useRef } from "react"
import { Lock, AlertTriangle, KeyRound, Loader2, CheckCircle } from "lucide-react"

interface InactivityLockScreenProps {
    onUnlocked: () => void
}

export function InactivityLockScreen({ onUnlocked }: InactivityLockScreenProps) {
    const [code, setCode] = useState("")
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim() || isSubmitting) return

        setIsSubmitting(true)
        setError("")

        try {
            const res = await fetch("/api/user/unban", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim() }),
            })

            const data = await res.json()

            if (data.success) {
                setSuccess(true)
                setTimeout(() => {
                    onUnlocked()
                }, 1200)
            } else {
                setError(data.error || "Código incorrecto")
                setCode("")
                inputRef.current?.focus()
            }
        } catch {
            setError("Error de conexión. Intenta de nuevo.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-xl">
            {/* Animated background gradient */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full opacity-[0.03]"
                    style={{
                        background: "radial-gradient(circle, hsl(0 84% 60%) 0%, transparent 70%)",
                        animation: "lockPulse 4s ease-in-out infinite",
                    }}
                />
                <div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full opacity-[0.03]"
                    style={{
                        background: "radial-gradient(circle, hsl(0 84% 60%) 0%, transparent 70%)",
                        animation: "lockPulse 4s ease-in-out infinite 2s",
                    }}
                />
            </div>

            <div className="relative w-full max-w-md mx-4">
                {/* Card */}
                <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center"
                            style={{
                                background: success
                                    ? "linear-gradient(135deg, hsl(152 80% 32% / 0.15), hsl(152 80% 32% / 0.05))"
                                    : "linear-gradient(135deg, hsl(0 84% 60% / 0.15), hsl(0 84% 60% / 0.05))",
                                border: success
                                    ? "2px solid hsl(152 80% 32% / 0.3)"
                                    : "2px solid hsl(0 84% 60% / 0.3)",
                                transition: "all 0.5s ease",
                            }}
                        >
                            {success ? (
                                <CheckCircle className="w-10 h-10 text-primary" style={{ animation: "lockBounce 0.5s ease" }} />
                            ) : (
                                <Lock className="w-10 h-10 text-destructive" style={{ animation: "lockShake 0.5s ease" }} />
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-center text-foreground mb-2">
                        {success ? "¡Desbloqueado!" : "Cuenta Bloqueada"}
                    </h1>

                    {/* Description */}
                    <div className="text-center mb-6">
                        {success ? (
                            <p className="text-sm text-primary font-medium">
                                Tu cuenta ha sido restaurada. Redirigiendo...
                            </p>
                        ) : (
                            <>
                                <div className="flex items-center justify-center gap-2 mb-3 text-amber-500">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Inactividad de 14+ días</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Cuando te comprometes a algo, debes mantener tu palabra.
                                    Si no, tu palabra no tiene valor.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Unban Form */}
                    {!success && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    <KeyRound className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                                    Código de desbloqueo
                                </label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value.toUpperCase())
                                        if (error) setError("")
                                    }}
                                    placeholder="Ingresa el código..."
                                    autoComplete="off"
                                    autoFocus
                                    className={`
                                        w-full px-4 py-3 rounded-xl text-center text-lg font-mono font-bold tracking-widest
                                        bg-secondary/50 border transition-all duration-200
                                        text-foreground placeholder:text-muted-foreground/50
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card
                                        ${error
                                            ? "border-destructive/50 focus:ring-destructive/50"
                                            : "border-border focus:ring-primary/50 focus:border-primary/50"
                                        }
                                    `}
                                />
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={!code.trim() || isSubmitting}
                                className={`
                                    w-full py-3 rounded-xl font-semibold text-sm
                                    flex items-center justify-center gap-2
                                    transition-all duration-200
                                    ${!code.trim() || isSubmitting
                                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                                        : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
                                    }
                                `}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    "Quiero una segunda oportunidad"
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer hint */}
                    {!success && (
                        <p className="text-xs text-muted-foreground/60 text-center mt-4">
                            ¿No tienes el código? Contacta a un administrador.
                        </p>
                    )}
                </div>
            </div>

            {/* Inline animations */}
            <style jsx>{`
                @keyframes lockPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes lockShake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-5deg); }
                    75% { transform: rotate(5deg); }
                }
                @keyframes lockBounce {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    )
}
