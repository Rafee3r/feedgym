"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { ChevronRight, Dumbbell, Scale, Calendar, Users, Flame, Target, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type GoalType = "CUT" | "BULK" | "MAINTAIN" | "RECOMP"

const GOALS = [
    { value: "CUT" as GoalType, label: "Definición", icon: TrendingDown, description: "Perder grasa, mantener músculo" },
    { value: "BULK" as GoalType, label: "Volumen", icon: TrendingUp, description: "Ganar músculo y fuerza" },
    { value: "MAINTAIN" as GoalType, label: "Mantener", icon: Target, description: "Mantener peso actual" },
    { value: "RECOMP" as GoalType, label: "Recomposición", icon: Flame, description: "Perder grasa, ganar músculo" },
]

const DAYS = [
    { value: "Monday", label: "L" },
    { value: "Tuesday", label: "M" },
    { value: "Wednesday", label: "X" },
    { value: "Thursday", label: "J" },
    { value: "Friday", label: "V" },
    { value: "Saturday", label: "S" },
    { value: "Sunday", label: "D" },
]

export default function OnboardingPage() {
    const router = useRouter()
    const { data: session, update } = useSession()
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form data
    const [goal, setGoal] = useState<GoalType | null>(null)
    const [weight, setWeight] = useState("")
    const [trainingDays, setTrainingDays] = useState<string[]>([])

    const totalSteps = 3

    const handleToggleDay = (day: string) => {
        if (trainingDays.includes(day)) {
            setTrainingDays(trainingDays.filter(d => d !== day))
        } else {
            setTrainingDays([...trainingDays, day])
        }
    }

    const handleSkip = async () => {
        await completeOnboarding()
    }

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1)
        } else {
            handleComplete()
        }
    }

    const handleComplete = async () => {
        setIsSubmitting(true)
        try {
            // Save profile data
            const profileData: any = { onboardingCompleted: true }
            if (goal) profileData.goal = goal
            if (trainingDays.length > 0) profileData.trainingDays = trainingDays

            const profileRes = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileData),
            })

            if (!profileRes.ok) throw new Error("Error saving profile")

            // Save weight if provided
            if (weight) {
                const weightValue = parseFloat(weight)
                if (!isNaN(weightValue) && weightValue > 0) {
                    await fetch("/api/weight", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ weight: weightValue, unit: "KG" }),
                    })
                }
            }

            toast({
                title: "¡Perfil configurado!",
                description: "Bienvenido a FeedGym",
                variant: "success",
            })

            await update()
            router.push("/")
        } catch (error) {
            console.error("Onboarding error:", error)
            toast({
                title: "Error",
                description: "No se pudo guardar la configuración",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const completeOnboarding = async () => {
        setIsSubmitting(true)
        try {
            await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ onboardingCompleted: true }),
            })
            await update()
            router.push("/")
        } catch {
            router.push("/")
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background">
            <div className="w-full max-w-md space-y-6 animate-in fade-in duration-500">
                {/* Progress */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 w-12 rounded-full transition-colors",
                                    i + 1 <= step ? "bg-primary" : "bg-muted"
                                )}
                            />
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSkip}
                        disabled={isSubmitting}
                        className="text-muted-foreground"
                    >
                        Saltar
                    </Button>
                </div>

                {/* Step 1: Goal */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <Dumbbell className="w-12 h-12 mx-auto text-primary mb-4" />
                            <h1 className="text-2xl font-bold">¿Cuál es tu meta?</h1>
                            <p className="text-muted-foreground mt-2">Esto nos ayuda a mostrarte información relevante</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {GOALS.map((g) => (
                                <button
                                    key={g.value}
                                    onClick={() => setGoal(g.value)}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all text-left",
                                        goal === g.value
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <g.icon className={cn("w-6 h-6 mb-2", goal === g.value ? "text-primary" : "text-muted-foreground")} />
                                    <div className="font-semibold">{g.label}</div>
                                    <div className="text-xs text-muted-foreground">{g.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Weight */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <Scale className="w-12 h-12 mx-auto text-primary mb-4" />
                            <h1 className="text-2xl font-bold">Tu peso actual</h1>
                            <p className="text-muted-foreground mt-2">Para tracking de progreso</p>
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="75.5"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="text-center text-2xl h-14 pr-12"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                    kg
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                💡 Tip: El peso ideal es el promedio de 7 días en ayunas
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 3: Training Days */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <Calendar className="w-12 h-12 mx-auto text-primary mb-4" />
                            <h1 className="text-2xl font-bold">Días de entreno</h1>
                            <p className="text-muted-foreground mt-2">Para medir tu constancia</p>
                        </div>
                        <div className="flex justify-center gap-2">
                            {DAYS.map((day) => (
                                <button
                                    key={day.value}
                                    onClick={() => handleToggleDay(day.value)}
                                    className={cn(
                                        "w-10 h-10 rounded-full font-semibold transition-all",
                                        trainingDays.includes(day.value)
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    )}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                        {trainingDays.length > 0 && (
                            <p className="text-center text-sm text-muted-foreground">
                                {trainingDays.length} días seleccionados
                            </p>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-full text-base font-medium"
                    size="lg"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : step === totalSteps ? (
                        "Empezar"
                    ) : (
                        <>
                            Continuar
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
