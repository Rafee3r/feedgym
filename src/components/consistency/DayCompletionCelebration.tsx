"use client"

import { useEffect, useState, useMemo } from "react"

const MESSAGES = [
    { text: "¡Día completado!", emoji: "💪" },
    { text: "¡Otra victoria!", emoji: "🔥" },
    { text: "¡Imparable!", emoji: "⚡" },
    { text: "¡Máquina!", emoji: "🏆" },
    { text: "¡Sigue así!", emoji: "🚀" },
]

const PARTICLE_COLORS = [
    "#22c55e", // green-500
    "#4ade80", // green-400
    "#facc15", // yellow-400
    "#f59e0b", // amber-500
    "#a855f7", // purple-500
    "#3b82f6", // blue-500
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
]

interface Particle {
    id: number
    x: number
    color: string
    size: number
    delay: number
    duration: number
    drift: number
    rotation: number
}

export function DayCompletionCelebration({ onComplete }: { onComplete?: () => void }) {
    const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter")

    const message = useMemo(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)], [])

    const particles = useMemo<Particle[]>(() => {
        return Array.from({ length: 35 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
            size: Math.random() * 6 + 4,
            delay: Math.random() * 0.6,
            duration: Math.random() * 1.2 + 1.4,
            drift: (Math.random() - 0.5) * 120,
            rotation: Math.random() * 720 - 360,
        }))
    }, [])

    useEffect(() => {
        const t1 = setTimeout(() => setPhase("visible"), 50)
        const t2 = setTimeout(() => setPhase("exit"), 2600)
        const t3 = setTimeout(() => onComplete?.(), 3200)
        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
        }
    }, [onComplete])

    return (
        <>
            {/* Inline keyframes — only injected once */}
            <style>{`
                @keyframes cel-confetti-fall {
                    0% {
                        transform: translateY(-20px) translateX(0px) rotate(0deg) scale(0);
                        opacity: 1;
                    }
                    15% {
                        transform: translateY(30px) translateX(var(--drift)) rotate(calc(var(--rot) * 0.3)) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(320px) translateX(var(--drift)) rotate(var(--rot)) scale(0.3);
                        opacity: 0;
                    }
                }
                @keyframes cel-glow-pulse {
                    0% { transform: scale(0); opacity: 0; }
                    30% { transform: scale(1.15); opacity: 1; }
                    50% { transform: scale(1); opacity: 1; }
                    70% { transform: scale(1.08); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes cel-check-draw {
                    0% { stroke-dashoffset: 48; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes cel-ring-expand {
                    0% { transform: scale(0); opacity: 0.8; }
                    60% { transform: scale(1.8); opacity: 0.3; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                @keyframes cel-text-pop {
                    0% { transform: translateY(10px) scale(0.8); opacity: 0; }
                    50% { transform: translateY(-3px) scale(1.05); opacity: 1; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes cel-sparkle {
                    0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
                    50% { transform: scale(1) rotate(180deg); opacity: 1; }
                }
            `}</style>

            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: phase === "exit" ? "none" : "auto",
                    transition: "opacity 500ms ease-out",
                    opacity: phase === "exit" ? 0 : 1,
                }}
                onClick={() => {
                    setPhase("exit")
                    setTimeout(() => onComplete?.(), 500)
                }}
            >
                {/* Backdrop */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "radial-gradient(circle at 50% 45%, rgba(34,197,94,0.12) 0%, rgba(0,0,0,0.55) 100%)",
                        backdropFilter: "blur(4px)",
                        transition: "opacity 400ms ease-out",
                        opacity: phase === "enter" ? 0 : 1,
                    }}
                />

                {/* Confetti particles */}
                {particles.map((p) => (
                    <div
                        key={p.id}
                        style={{
                            position: "absolute",
                            top: "35%",
                            left: `${p.x}%`,
                            width: p.size,
                            height: p.size * (Math.random() > 0.5 ? 1 : 0.6),
                            backgroundColor: p.color,
                            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            ["--drift" as any]: `${p.drift}px`,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            ["--rot" as any]: `${p.rotation}deg`,
                            animation: `cel-confetti-fall ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
                            opacity: 0,
                        }}
                    />
                ))}

                {/* Center badge */}
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 16,
                        zIndex: 1,
                    }}
                >
                    {/* Expanding ring */}
                    <div
                        style={{
                            position: "absolute",
                            width: 96,
                            height: 96,
                            borderRadius: "50%",
                            border: "3px solid rgba(34,197,94,0.5)",
                            animation: phase !== "enter" ? "cel-ring-expand 1.2s ease-out 0.2s forwards" : "none",
                            opacity: 0,
                        }}
                    />

                    {/* Second ring (staggered) */}
                    <div
                        style={{
                            position: "absolute",
                            width: 96,
                            height: 96,
                            borderRadius: "50%",
                            border: "2px solid rgba(250,204,21,0.4)",
                            animation: phase !== "enter" ? "cel-ring-expand 1.4s ease-out 0.45s forwards" : "none",
                            opacity: 0,
                        }}
                    />

                    {/* Glow circle + check */}
                    <div
                        style={{
                            width: 96,
                            height: 96,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)",
                            boxShadow: "0 0 40px rgba(34,197,94,0.5), 0 0 80px rgba(34,197,94,0.2), inset 0 -2px 6px rgba(0,0,0,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            animation: phase !== "enter" ? "cel-glow-pulse 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "none",
                            transform: "scale(0)",
                        }}
                    >
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M5 13l4 4L19 7"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    strokeDasharray: 48,
                                    strokeDashoffset: 48,
                                    animation: phase !== "enter" ? "cel-check-draw 0.5s ease-out 0.5s forwards" : "none",
                                }}
                            />
                        </svg>
                    </div>

                    {/* Sparkles around the circle */}
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                        const rad = (angle * Math.PI) / 180
                        const dist = 68
                        return (
                            <div
                                key={angle}
                                style={{
                                    position: "absolute",
                                    top: 48 + Math.sin(rad) * dist - 4,
                                    left: 48 + Math.cos(rad) * dist - 4,
                                    width: 8,
                                    height: 8,
                                    transform: "translate(-50%, -50%)",
                                }}
                            >
                                <svg width="8" height="8" viewBox="0 0 8 8">
                                    <path
                                        d="M4 0L4.8 3.2L8 4L4.8 4.8L4 8L3.2 4.8L0 4L3.2 3.2Z"
                                        fill={i % 2 === 0 ? "#facc15" : "#22c55e"}
                                        style={{
                                            animation: phase !== "enter" ? `cel-sparkle 0.8s ease-in-out ${0.3 + i * 0.12}s forwards` : "none",
                                            opacity: 0,
                                        }}
                                    />
                                </svg>
                            </div>
                        )
                    })}

                    {/* Motivational text */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                            animation: phase !== "enter" ? "cel-text-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards" : "none",
                            opacity: 0,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 36,
                                lineHeight: 1,
                                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
                            }}
                        >
                            {message.emoji}
                        </span>
                        <span
                            style={{
                                fontSize: 20,
                                fontWeight: 800,
                                color: "white",
                                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {message.text}
                        </span>
                        <span
                            style={{
                                fontSize: 13,
                                color: "rgba(255,255,255,0.7)",
                                fontWeight: 500,
                            }}
                        >
                            Toca para continuar
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
