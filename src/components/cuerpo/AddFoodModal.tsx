"use client"

import { useState, useEffect } from "react"
import { Camera, Loader2, Clock, Flame, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
            case "CUT": return "Definición"
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

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

                            {/* Main meal grid */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Sugerencias para ti
                                </h4>
                                <div className="grid gap-2">
                                    {meals.map((meal) => (
                                        <button
                                            key={meal.id}
                                            onClick={() => handleAdd(meal)}
                                            disabled={addingId === meal.id}
                                            className={cn(
                                                "w-full text-left p-3 rounded-xl border transition-all",
                                                "hover:bg-accent/50 hover:border-primary/50",
                                                "flex items-center justify-between gap-3",
                                                addingId === meal.id && "opacity-50 pointer-events-none"
                                            )}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{meal.name}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Flame className="w-3 h-3 text-orange-400" />
                                                        {meal.calories} kcal
                                                    </span>
                                                    <span>•</span>
                                                    <span>{meal.protein}g prot</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {meal.prepTime}m
                                                    </span>
                                                </div>
                                                <div className="flex gap-1 mt-1.5">
                                                    {meal.tags.slice(0, 2).map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className={cn(
                                                                "text-[10px] px-1.5 py-0.5 rounded-full capitalize",
                                                                getTagColor(tag)
                                                            )}
                                                        >
                                                            {tag === "bulk" ? "Volumen" : tag === "cut" ? "Déficit" : tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                {addingId === meal.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                        +
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Camera fallback */}
                            <div className="pt-4 border-t border-border">
                                <Button variant="outline" className="w-full" onClick={() => {
                                    // Open camera modal or inline upload
                                }}>
                                    <Camera className="w-4 h-4 mr-2" />
                                    Escanear comida con IA
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
