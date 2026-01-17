"use client"

import { useState, useEffect } from "react"
import { Camera, Loader2, Clock, Flame, RefreshCw, Sparkles, Wand2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface Meal {
    id: string
    name: string
    calories: number
    protein: number
    carbs: number
    fats: number
    tags: string[]
    prepTime: number
}

interface YesterdayMeal {
    name: string
    mealType: string
    calories: number
    protein: number
    carbs: number
    fats: number
}

interface AddFoodModalProps {
    isOpen: boolean
    onClose: () => void
    mealType: string
    onAddFood: (foodItem: any) => void
}

export function AddFoodModal({ isOpen, onClose, mealType, onAddFood }: AddFoodModalProps) {
    const [meals, setMeals] = useState<Meal[]>([])
    const [yesterdayMeals, setYesterdayMeals] = useState<YesterdayMeal[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userGoal, setUserGoal] = useState<string>("MAINTAIN")
    const [addingId, setAddingId] = useState<string | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [isGeneratingAI, setIsGeneratingAI] = useState(false)

    // Map mealType to category
    const getCategoryFromType = (type: string): string => {
        switch (type) {
            case "BREAKFAST": return "desayuno"
            case "LUNCH": return "almuerzo"
            case "DINNER": return "cena"
            case "SNACK": return "snack"
            default: return "almuerzo"
        }
    }

    const category = getCategoryFromType(mealType)

    // Fetch meals on open
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true)
            fetch(`/api/nutrition/meals?category=${category}`)
                .then(res => res.json())
                .then(data => {
                    setMeals(data.meals || [])
                    setYesterdayMeals(data.yesterdayMeals || [])
                    setUserGoal(data.userGoal || "MAINTAIN")
                })
                .catch(console.error)
                .finally(() => setIsLoading(false))
        }
    }, [isOpen, category])

    const handleAdd = async (meal: Meal | YesterdayMeal) => {
        setAddingId("id" in meal ? meal.id : meal.name)
        try {
            await onAddFood({
                name: meal.name,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fats: meal.fats,
                mealType,
            })
            onClose()
        } finally {
            setAddingId(null)
        }
    }

    // AI Scan Food - uses camera/photo analysis
    const handleAIScan = async () => {
        setIsScanning(true)
        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })

            // Create video element to capture frame
            const video = document.createElement('video')
            video.srcObject = stream
            await video.play()

            // Capture frame to canvas
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            canvas.getContext('2d')?.drawImage(video, 0, 0)

            // Stop camera
            stream.getTracks().forEach(track => track.stop())

            // Convert to base64
            const imageData = canvas.toDataURL('image/jpeg', 0.8)

            // Send to AI for analysis
            const res = await fetch('/api/ai/analyze-food', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            })

            if (res.ok) {
                const foodData = await res.json()
                await onAddFood({
                    name: foodData.name,
                    calories: foodData.calories,
                    protein: foodData.protein,
                    carbs: foodData.carbs,
                    fats: foodData.fats,
                    mealType,
                })
                onClose()
            }
        } catch (error) {
            console.error('Scan failed:', error)
            // Fallback: generate AI suggestion instead
            await handleAIGenerate()
        } finally {
            setIsScanning(false)
        }
    }

    // AI Generate meal suggestion
    const handleAIGenerate = async () => {
        setIsGeneratingAI(true)
        try {
            const res = await fetch('/api/ai/recommend-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mealType, goal: userGoal })
            })

            if (res.ok) {
                const suggestion = await res.json()
                await onAddFood({
                    name: suggestion.name,
                    calories: suggestion.calories,
                    protein: suggestion.protein,
                    carbs: suggestion.carbs,
                    fats: suggestion.fats,
                    mealType,
                })
                onClose()
            }
        } catch (error) {
            console.error('AI generate failed:', error)
        } finally {
            setIsGeneratingAI(false)
        }
    }

    const getMealLabel = (type: string) => {
        switch (type) {
            case "BREAKFAST": return "Desayuno"
            case "LUNCH": return "Almuerzo"
            case "DINNER": return "Cena"
            case "SNACK": return "Snack"
            default: return type
        }
    }

    const getGoalLabel = (goal: string) => {
        switch (goal) {
            case "CUT": return "Déficit"
            case "BULK": return "Volumen"
            default: return "Balance"
        }
    }

    const getTagColor = (tag: string) => {
        switch (tag) {
            case "bulk": return "bg-amber-500/20 text-amber-400"
            case "cut": return "bg-green-500/20 text-green-400"
            case "balanced": return "bg-blue-500/20 text-blue-400"
            default: return "bg-muted text-muted-foreground"
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 bg-background overflow-hidden">
                <DialogHeader className="p-4 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Agregar {getMealLabel(mealType)}</span>
                        <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded-full">
                            Meta: {getGoalLabel(userGoal)}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {/* AI Scan Button - Hero Section */}
                    <div className="p-4 border-b border-border bg-gradient-to-b from-indigo-500/5 to-transparent">
                        <button
                            onClick={handleAIScan}
                            disabled={isScanning || isGeneratingAI}
                            className={cn(
                                "w-full relative overflow-hidden rounded-2xl p-4",
                                "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500",
                                "hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400",
                                "shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40",
                                "transition-all duration-300 group",
                                (isScanning || isGeneratingAI) && "opacity-80"
                            )}
                        >
                            {/* Animated background shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                            {/* Floating particles effect */}
                            <div className="absolute top-2 left-4 w-1 h-1 bg-white/40 rounded-full animate-pulse" />
                            <div className="absolute top-4 right-8 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse delay-150" />
                            <div className="absolute bottom-3 left-12 w-1 h-1 bg-white/50 rounded-full animate-pulse delay-300" />

                            <div className="relative flex items-center justify-center gap-3">
                                {isScanning || isGeneratingAI ? (
                                    <>
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        <span className="text-white font-semibold">
                                            {isScanning ? "Escaneando..." : "Generando..."}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <Camera className="w-6 h-6 text-white" />
                                            <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white font-semibold text-base">Escanear con IA</p>
                                            <p className="text-white/70 text-xs">Toma una foto y detectamos los macros</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </button>

                        {/* AI Generate Alternative */}
                        <button
                            onClick={handleAIGenerate}
                            disabled={isScanning || isGeneratingAI}
                            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Wand2 className="w-4 h-4" />
                            <span>O deja que la IA sugiera algo</span>
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                {/* Yesterday's meals - Repeat suggestion */}
                                {yesterdayMeals.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                            <RefreshCw className="w-3 h-3" />
                                            ¿Repetir de ayer?
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {yesterdayMeals.map((meal, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleAdd(meal)}
                                                    disabled={addingId === meal.name}
                                                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 px-3 py-2 rounded-lg transition-all text-left"
                                                >
                                                    <span className="text-sm font-medium">{meal.name}</span>
                                                    <span className="text-xs text-muted-foreground">{meal.calories} kcal</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Meal suggestions */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Sugerencias para ti
                                    </h4>
                                    <div className="space-y-2">
                                        {meals.map((meal) => (
                                            <button
                                                key={meal.id}
                                                onClick={() => handleAdd(meal)}
                                                disabled={addingId === meal.id}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 rounded-xl border border-border",
                                                    "hover:border-primary/50 hover:bg-accent/30 transition-all text-left",
                                                    addingId === meal.id && "opacity-50"
                                                )}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">{meal.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                        <span className="text-orange-500 font-medium flex items-center gap-0.5">
                                                            <Flame className="w-3 h-3" />
                                                            {meal.calories} kcal
                                                        </span>
                                                        <span>•</span>
                                                        <span>{meal.protein}g prot</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-0.5">
                                                            <Clock className="w-3 h-3" />
                                                            {meal.prepTime}m
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 mt-1">
                                                        {meal.tags.slice(0, 2).map(tag => (
                                                            <span
                                                                key={tag}
                                                                className={cn("text-[10px] px-1.5 py-0.5 rounded-md capitalize", getTagColor(tag))}
                                                            >
                                                                {tag === "cut" ? "Déficit" : tag === "bulk" ? "Volumen" : tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="ml-3">
                                                    {addingId === meal.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                                                            <span className="text-lg font-light">+</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
