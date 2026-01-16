"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calculator, Flame } from "lucide-react"
import { MacroCircle } from "@/components/cuerpo/MacroCircle"

import { CalendarStrip } from "@/components/cuerpo/CalendarStrip"
import { MealCard } from "@/components/cuerpo/MealCard"
import { RecommendationsCarousel } from "@/components/cuerpo/RecommendationsCarousel"
import { ShoppingListModal } from "@/components/cuerpo/ShoppingListModal"
import { MealType } from "@/types"
import { ShoppingCart } from "lucide-react"

import { AddFoodModal } from "@/components/cuerpo/AddFoodModal"
import { useNutrition } from "@/hooks/useNutrition"
import { useToast } from "@/hooks/use-toast"

export default function CuerpoPage() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isAddFoodOpen, setIsAddFoodOpen] = useState(false)
    const [isShoppingListOpen, setIsShoppingListOpen] = useState(false)
    const [activeMealType, setActiveMealType] = useState<string>(MealType.BREAKFAST)

    const { dailyLog, isLoading, refresh } = useNutrition(selectedDate)

    const handleAddFood = (type: string) => {
        setActiveMealType(type)
        setIsAddFoodOpen(true)
    }

    const handleFoodAdded = async (foodItem: any) => {
        try {
            const res = await fetch("/api/nutrition/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: selectedDate,
                    mealType: activeMealType,
                    foodItem
                })
            })

            if (res.ok) {
                await refresh()
                toast({
                    title: "Alimento agregado",
                    description: `${foodItem.name} (${foodItem.calories} kcal)`,
                })
            }
        } catch (error) {
            console.error("Failed to add food", error)
        }
    }

    const handleRecommend = async (type: string) => {
        toast({
            title: "IRON está pensando...",
            description: "Analizando tu cocina y metas...",
        })

        try {
            const res = await fetch("/api/ai/recommend-meal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mealType: type })
            })

            if (res.ok) {
                const suggestion = await res.json()

                // Automatically add the suggestion
                const addRes = await fetch("/api/nutrition/log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        date: selectedDate,
                        mealType: type,
                        foodItem: suggestion
                    })
                })

                if (addRes.ok) {
                    await refresh()
                    toast({
                        title: "✨ Recomendación agregada",
                        description: `IRON sugirió: ${suggestion.name}`,
                        className: "bg-indigo-500 text-white border-none"
                    })
                }
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo generar una recomendación.",
            })
        }
    }

    const handleQuickAdd = async (item: any) => {
        // Reuse handleFoodAdded but set type appropriately if needed, or default to Breakfast for this mock
        setActiveMealType(MealType.BREAKFAST)
        await handleFoodAdded(item)
    }

    const handleDeleteEntry = async (entryId: string) => {
        try {
            const res = await fetch(`/api/nutrition/entry/${entryId}`, {
                method: "DELETE",
            })
            if (res.ok) {
                await refresh()
            }
        } catch (error) {
            console.error("Failed to delete entry", error)
        }
    }

    const handleRepeatEntry = async (entry: any) => {
        // Add entry to tomorrow's log
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        try {
            await fetch("/api/nutrition/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: tomorrow,
                    mealType: activeMealType || entry.mealType || MealType.BREAKFAST,
                    foodItem: {
                        name: entry.name,
                        calories: entry.calories,
                        protein: entry.protein,
                        carbs: entry.carbs,
                        fats: entry.fats,
                    }
                })
            })
        } catch (error) {
            console.error("Failed to repeat entry", error)
        }
    }

    const getMealData = (type: string) => {
        if (!dailyLog?.meals) return { calories: 0, items: [] }
        const meal = dailyLog.meals.find((m: any) => m.type === type)
        return meal ? { calories: meal.calories, items: meal.items } : { calories: 0, items: [] }
    }

    // Default targets (could be fetched from user settings later)
    const targets = {
        calories: 2400,
        protein: 160,
        carbs: 280,
        fats: 70
    }

    // Use real stats if available, otherwise 0
    const stats = dailyLog ? {
        calories: dailyLog.calories,
        protein: dailyLog.protein,
        carbs: dailyLog.carbs,
        fats: dailyLog.fats
    } : { calories: 0, protein: 0, carbs: 0, fats: 0 }

    return (
        <div className="max-w-2xl mx-auto pb-24 px-0 sm:px-0">
            {/* Date Selector */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <h1 className="font-bold text-lg">Diario</h1>
                        <button
                            onClick={() => setIsShoppingListOpen(true)}
                            className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Lista de Compras"
                        >
                            <ShoppingCart className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-orange-500 font-medium bg-orange-500/10 px-2 py-1 rounded-full">
                        <Flame className="w-3 h-3 fill-current" />
                        <span>Racha: 3 días</span>
                    </div>
                </div>
                <CalendarStrip
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />
            </div>

            <div className="px-3 sm:p-4 space-y-4">
                {/* Hero Card - Macro Circle */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">Resumen Diario</h2>
                        <button className="text-sm text-primary flex items-center gap-1 hover:underline">
                            <Calculator className="w-4 h-4" />
                            Ajustar Metas
                        </button>
                    </div>

                    <div className="flex justify-center py-4">
                        <MacroCircle
                            currentCalories={stats.calories}
                            targetCalories={targets.calories}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Proteína</p>
                            <p className="font-bold text-lg">{stats.protein} / {targets.protein}g</p>
                            <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (stats.protein / targets.protein) * 100)}%` }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Carbs</p>
                            <p className="font-bold text-lg">{stats.carbs} / {targets.carbs}g</p>
                            <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min(100, (stats.carbs / targets.carbs) * 100)}%` }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Grasas</p>
                            <p className="font-bold text-lg">{stats.fats} / {targets.fats}g</p>
                            <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (stats.fats / targets.fats) * 100)}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations Carousel (New) */}
                <RecommendationsCarousel
                    onSelect={handleQuickAdd}
                />

                {/* Meal Sections */}
                <div className="space-y-4">
                    {[MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK].map((type) => {
                        const data = getMealData(type)
                        return (
                            <MealCard
                                key={type}
                                type={type}
                                calories={data.calories}
                                items={data.items}
                                onAddFood={() => handleAddFood(type)}
                                onRecommend={() => handleRecommend(type)}
                                onDeleteEntry={handleDeleteEntry}
                                onRepeatEntry={handleRepeatEntry}
                            />
                        )
                    })}
                </div>
            </div>

            <ShoppingListModal
                isOpen={isShoppingListOpen}
                onClose={() => setIsShoppingListOpen(false)}
            />

            <AddFoodModal
                isOpen={isAddFoodOpen}
                onClose={() => setIsAddFoodOpen(false)}
                mealType={activeMealType}
                onAddFood={handleFoodAdded}
            />
        </div >
    )
}
