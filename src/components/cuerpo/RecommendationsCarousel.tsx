"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, ArrowRight, Clock, Flame, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface Meal {
    id: string
    name: string
    calories: number
    protein: number
    carbs: number
    fats: number
    prepTime: number
    tags: string[]
}

interface RecommendationsCarouselProps {
    onSelect?: (item: Meal) => void
    onScanFood?: () => void
    className?: string
}

// Get meal category based on current hour
function getMealCategory(hour: number): { category: string; title: string; subtitle: string } {
    if (hour >= 5 && hour < 11) {
        return { category: "desayuno", title: "Desayunos para hoy", subtitle: "Comienza tu día con energía" }
    } else if (hour >= 11 && hour < 15) {
        return { category: "almuerzo", title: "Almuerzos para hoy", subtitle: "Mantén tu rendimiento" }
    } else if (hour >= 15 && hour < 18) {
        return { category: "snack", title: "Snacks para la tarde", subtitle: "Recarga energías" }
    } else {
        return { category: "cena", title: "Cenas para esta noche", subtitle: "Cierra el día bien" }
    }
}

export function RecommendationsCarousel({
    onSelect,
    onScanFood,
    className
}: RecommendationsCarouselProps) {
    const [meals, setMeals] = useState<Meal[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAllDialog, setShowAllDialog] = useState(false)
    const [addingId, setAddingId] = useState<string | null>(null)

    // Get time-based category
    const currentHour = new Date().getHours()
    const { category, title, subtitle } = useMemo(() => getMealCategory(currentHour), [currentHour])

    useEffect(() => {
        const fetchMeals = async () => {
            try {
                const res = await fetch(`/api/nutrition/meals?category=${category}`)
                if (res.ok) {
                    const data = await res.json()
                    setMeals(data.meals || [])
                }
            } catch (error) {
                console.error("Failed to fetch meals", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchMeals()
    }, [category])

    const handleAdd = async (meal: Meal) => {
        setAddingId(meal.id)
        try {
            await onSelect?.(meal)
        } finally {
            setAddingId(null)
        }
    }

    // Show first 4 meals in carousel
    const displayMeals = meals.slice(0, 4)

    if (isLoading) {
        return (
            <div className={cn("space-y-3", className)}>
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                <div className="flex gap-3 overflow-hidden">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-40 h-32 bg-muted animate-pulse rounded-xl shrink-0" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            <div className={cn("space-y-3", className)}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-base">{title}</h3>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                    <button
                        onClick={() => setShowAllDialog(true)}
                        className="text-primary text-xs font-medium flex items-center gap-1 hover:underline"
                    >
                        Ver todos <ArrowRight className="w-3 h-3" />
                    </button>
                </div>

                {/* Quick Actions Row */}
                <div className="flex gap-2">
                    {onScanFood && (
                        <button
                            onClick={onScanFood}
                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
                        >
                            <Camera className="w-4 h-4" />
                            Escanear comida
                        </button>
                    )}
                </div>

                {/* Compact Meal Cards with Food Images */}
                <div className="grid grid-cols-2 gap-2">
                    {displayMeals.map((meal) => {
                        // Generate food-themed gradient based on tags/name
                        const getGradient = () => {
                            const name = meal.name.toLowerCase()
                            const tags = meal.tags.map(t => t.toLowerCase())

                            if (name.includes("pollo") || name.includes("carne") || name.includes("atún") || name.includes("huevo") || tags.includes("proteína")) {
                                return "from-rose-500/80 to-orange-400/80"
                            }
                            if (name.includes("avena") || name.includes("pan") || name.includes("arroz") || tags.includes("carbos")) {
                                return "from-amber-500/80 to-yellow-400/80"
                            }
                            if (name.includes("ensalada") || name.includes("verdura") || name.includes("fruta")) {
                                return "from-emerald-500/80 to-green-400/80"
                            }
                            if (name.includes("batido") || name.includes("yogurt") || name.includes("leche")) {
                                return "from-blue-500/80 to-cyan-400/80"
                            }
                            if (name.includes("tostada") || name.includes("sandwich")) {
                                return "from-orange-500/80 to-amber-400/80"
                            }
                            // Default gradient
                            return "from-violet-500/80 to-purple-400/80"
                        }

                        // Get emoji for food
                        const getEmoji = () => {
                            const name = meal.name.toLowerCase()
                            if (name.includes("huevo")) return "🍳"
                            if (name.includes("pollo")) return "🍗"
                            if (name.includes("carne")) return "🥩"
                            if (name.includes("atún") || name.includes("pescado")) return "🐟"
                            if (name.includes("avena")) return "🥣"
                            if (name.includes("batido")) return "🥤"
                            if (name.includes("ensalada")) return "🥗"
                            if (name.includes("fruta") || name.includes("manzana")) return "🍎"
                            if (name.includes("yogurt")) return "🥛"
                            if (name.includes("tostada") || name.includes("pan")) return "🍞"
                            if (name.includes("arroz")) return "🍚"
                            if (name.includes("sandwich")) return "🥪"
                            if (name.includes("granola")) return "🥜"
                            return "🍽️"
                        }

                        return (
                            <button
                                key={meal.id}
                                onClick={() => handleAdd(meal)}
                                disabled={addingId === meal.id}
                                className={cn(
                                    "text-left bg-card border border-border rounded-xl overflow-hidden",
                                    "hover:border-primary/50 hover:bg-accent/30 transition-all",
                                    "flex flex-col",
                                    addingId === meal.id && "opacity-50"
                                )}
                            >
                                {/* Food Image Banner */}
                                <div className="h-12 bg-muted/50 flex items-center justify-center">
                                    <span className="text-2xl">{getEmoji()}</span>
                                </div>

                                {/* Content */}
                                <div className="p-2.5 flex flex-col gap-1">
                                    <span className="font-medium text-sm line-clamp-1">{meal.name}</span>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="text-orange-500 font-medium flex items-center gap-0.5">
                                            <Flame className="w-3 h-3" />
                                            {meal.calories}
                                        </span>
                                        <span>•</span>
                                        <span>{meal.protein}g prot</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5">
                                            <Clock className="w-3 h-3" />
                                            {meal.prepTime}m
                                        </span>
                                    </div>
                                    <div className="flex gap-1 mt-0.5">
                                        {meal.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md capitalize">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Ver Todos Dialog */}
            <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
                <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-4 pb-2 border-b border-border">
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {meals.map((meal) => (
                            <button
                                key={meal.id}
                                onClick={() => {
                                    handleAdd(meal)
                                    setShowAllDialog(false)
                                }}
                                disabled={addingId === meal.id}
                                className={cn(
                                    "w-full text-left p-3 bg-card border border-border rounded-xl",
                                    "hover:border-primary/50 hover:bg-accent/30 transition-all",
                                    "flex items-center justify-between gap-3"
                                )}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{meal.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        <span className="text-orange-500 font-medium">{meal.calories} kcal</span>
                                        <span>•</span>
                                        <span>{meal.protein}g prot</span>
                                        <span>•</span>
                                        <span>{meal.prepTime}m</span>
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                        {meal.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md capitalize">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <Plus className="w-5 h-5 text-primary shrink-0" />
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
