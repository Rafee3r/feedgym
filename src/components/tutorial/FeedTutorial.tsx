"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { X, Sparkles, User, Palette, PenSquare, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TutorialStep {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    target?: string // CSS selector for highlight
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: "welcome",
        title: "¡Bienvenido a FeedGym!",
        description: "Te guiaremos por las funciones principales. Solo tomará unos segundos.",
        icon: <Sparkles className="w-6 h-6" />,
    },
    {
        id: "compose",
        title: "Publica tu progreso",
        description: "Usa el compositor para compartir entrenamientos, PRs, y notas diarias.",
        icon: <PenSquare className="w-6 h-6" />,
        target: "[data-tutorial='composer']",
    },
    {
        id: "profile",
        title: "Personaliza tu perfil",
        description: "Añade tu foto, bio, y configura tus días de entreno.",
        icon: <User className="w-6 h-6" />,
        target: "[data-tutorial='profile']",
    },
    {
        id: "theme",
        title: "Elige tu tema",
        description: "Modo oscuro, claro, o pitch black. Encuéntralo en ajustes.",
        icon: <Palette className="w-6 h-6" />,
        target: "[data-tutorial='settings']",
    },
]

export function FeedTutorial() {
    const { data: session, update } = useSession()
    const [isVisible, setIsVisible] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [isCompleting, setIsCompleting] = useState(false)

    useEffect(() => {
        // Check if user needs tutorial
        if (session?.user) {
            // Fetch user data to check tutorialCompleted
            fetch("/api/users/me")
                .then(res => res.json())
                .then(data => {
                    if (data.onboardingCompleted && !data.tutorialCompleted) {
                        setIsVisible(true)
                    }
                })
                .catch(() => { })
        }
    }, [session])

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            handleComplete()
        }
    }

    const handleComplete = async () => {
        setIsCompleting(true)
        try {
            await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tutorialCompleted: true }),
            })
            setIsVisible(false)
        } catch (error) {
            console.error("Error completing tutorial:", error)
            setIsVisible(false)
        }
    }

    const handleSkip = () => {
        handleComplete()
    }

    if (!isVisible) return null

    const step = TUTORIAL_STEPS[currentStep]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

            {/* Tutorial Card */}
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-300">
                {/* Close button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 mb-6">
                    {TUTORIAL_STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-2 h-2 rounded-full transition-colors",
                                i === currentStep ? "bg-primary" : "bg-muted"
                            )}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                        {step.icon}
                    </div>
                    <h2 className="text-xl font-bold">{step.title}</h2>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8">
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        disabled={isCompleting}
                        className="flex-1"
                    >
                        Saltar
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={isCompleting}
                        className="flex-1"
                    >
                        {currentStep === TUTORIAL_STEPS.length - 1 ? (
                            "Empezar"
                        ) : (
                            <>
                                Siguiente
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
