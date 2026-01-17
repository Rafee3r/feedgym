"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Calculator, Flame, Camera, Settings2, Target } from "lucide-react"
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
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function CuerpoPage() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isAddFoodOpen, setIsAddFoodOpen] = useState(false)
    const [isShoppingListOpen, setIsShoppingListOpen] = useState(false)
    const [isMacroSettingsOpen, setIsMacroSettingsOpen] = useState(false)
    const [activeMealType, setActiveMealType] = useState<string>(MealType.BREAKFAST)

    const { dailyLog, isLoading, refresh } = useNutrition(selectedDate)

    // Streak state (would be from API in production)
    const [streak, setStreak] = useState(3)

    // User targets - calculated based on weight and goal
    const [targets, setTargets] = useState({
        calories: 2000,
        protein: 140,
        carbs: 250,
        fats: 65
    })

    // Fetch user profile and calculate personalized targets
    useEffect(() => {
        const fetchUserAndCalculateTargets = async () => {
            try {
                const res = await fetch('/api/user/profile')
                if (!res.ok) return

                const user = await res.json()
                const weight = user.weight || 70 // kg
                const goal = user.goal || 'MAINTAIN'

                // Calculate BMR using Mifflin-St Jeor (simplified, assuming moderate activity)
                // Men: BMR = 10 × weight + 6.25 × height − 5 × age + 5
                // Simplified: ~24 kcal per kg bodyweight × activity factor (1.5)
                const baseTDEE = weight * 24 * 1.5

                let targetCalories: number
                let proteinPerKg: number

                switch (goal) {
                    case 'CUT':
                        // Deficit: -500 kcal, high protein to preserve muscle
                        targetCalories = Math.round(baseTDEE - 500)
                        proteinPerKg = 2.2 // Higher protein during cut
                        break
                    case 'BULK':
                        // Surplus: +300-500 kcal for lean gains
                        targetCalories = Math.round(baseTDEE + 400)
                        proteinPerKg = 1.8
                        break
                    default: // MAINTAIN
                        targetCalories = Math.round(baseTDEE)
                        proteinPerKg = 2.0
                }

                const protein = Math.round(weight * proteinPerKg)
                // Fats: ~25-30% of calories
                const fats = Math.round((targetCalories * 0.25) / 9)
                // Carbs: remaining calories
                const carbs = Math.round((targetCalories - (protein * 4) - (fats * 9)) / 4)

                setTargets({
                    calories: targetCalories,
                    protein: Math.max(protein, 100), // minimum 100g
                    carbs: Math.max(carbs, 100), // minimum 100g
                    fats: Math.max(fats, 40) // minimum 40g
                })
            } catch (error) {
                console.error('Failed to fetch user profile:', error)
            }
        }

        fetchUserAndCalculateTargets()
    }, [])

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
                    title: "✓ Agregado",
                    description: `${foodItem.name} (${foodItem.calories} kcal)`,
                })
            }
        } catch (error) {
            console.error("Failed to add food", error)
        }
    }

    const handleQuickAdd = async (item: any) => {
        // Determine meal type based on time
        const hour = new Date().getHours()
        let mealType: MealType = MealType.BREAKFAST
        if (hour >= 11 && hour < 15) mealType = MealType.LUNCH
        else if (hour >= 15 && hour < 18) mealType = MealType.SNACK
        else if (hour >= 18) mealType = MealType.DINNER

        setActiveMealType(mealType)
        await handleFoodAdded({
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fats,
        })
    }

    const handleRecommend = async (type: string) => {
        toast({
            title: "IRON está pensando...",
            description: "Armando tu comida ideal...",
        })

        try {
            const res = await fetch("/api/ai/recommend-meal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mealType: type })
            })

            if (res.ok) {
                const suggestion = await res.json()
                await handleFoodAdded(suggestion)
                toast({
                    title: "✨ Comida armada",
                    description: suggestion.name,
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo generar recomendación",
            })
        }
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
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        try {
            await fetch("/api/nutrition/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: tomorrow,
                    mealType: entry.mealType || MealType.BREAKFAST,
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

    const handleScanFood = () => {
        // Open camera/scan modal
        setActiveMealType(MealType.BREAKFAST) // Default
        setIsAddFoodOpen(true)
        // Could navigate to camera tab directly
    }

    const handleSaveMacros = (newTargets: typeof targets) => {
        setTargets(newTargets)
        setIsMacroSettingsOpen(false)
        toast({ title: "Metas actualizadas" })
        // In production: save to API
    }

    const getMealData = (type: string) => {
        if (!dailyLog?.meals) return { calories: 0, items: [] }
        const meal = dailyLog.meals.find((m: any) => m.type === type)
        return meal ? { calories: meal.calories, items: meal.items } : { calories: 0, items: [] }
    }

    const stats = dailyLog ? {
        calories: dailyLog.calories,
        protein: dailyLog.protein,
        carbs: dailyLog.carbs,
        fats: dailyLog.fats
    } : { calories: 0, protein: 0, carbs: 0, fats: 0 }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-background border-b border-border">
                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <h1 className="font-bold text-xl">Nutrición</h1>
                        {streak > 0 && (
                            <div className="flex items-center gap-1 text-xs text-orange-500 font-semibold bg-orange-500/10 px-2 py-1 rounded-full">
                                <Flame className="w-3 h-3 fill-current" />
                                <span>{streak} días</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleScanFood}
                            className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Escanear comida"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsShoppingListOpen(true)}
                            className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Lista de compras"
                        >
                            <ShoppingCart className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Calendar Strip */}
                <CalendarStrip
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
                {/* Macro Summary Card - Minimalist */}
                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-sm text-muted-foreground">Resumen del día</h2>
                            <p className="text-3xl font-bold">
                                {stats.calories}
                                <span className="text-lg text-muted-foreground font-normal"> / {targets.calories}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">calorías</p>
                        </div>
                        <button
                            onClick={() => setIsMacroSettingsOpen(true)}
                            className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Ajustar metas"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Macro Bars - Clean Style */}
                    <div className="space-y-3">
                        {[
                            { label: "Proteína", current: stats.protein, target: targets.protein, color: "bg-blue-500", unit: "g" },
                            { label: "Carbohidratos", current: stats.carbs, target: targets.carbs, color: "bg-amber-500", unit: "g" },
                            { label: "Grasas", current: stats.fats, target: targets.fats, color: "bg-rose-500", unit: "g" },
                        ].map((macro) => (
                            <div key={macro.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">{macro.label}</span>
                                    <span className="font-medium">
                                        {macro.current} <span className="text-muted-foreground">/ {macro.target}{macro.unit}</span>
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all", macro.color)}
                                        style={{ width: `${Math.min(100, (macro.current / macro.target) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Time-based Recommendations */}
                <RecommendationsCarousel
                    onSelect={handleQuickAdd}
                    onScanFood={handleScanFood}
                />

                {/* Meal Cards */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground px-1">Tus comidas</h3>
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

            {/* Modals */}
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

            {/* Macro Settings Modal */}
            <Dialog open={isMacroSettingsOpen} onOpenChange={setIsMacroSettingsOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Ajustar metas
                        </DialogTitle>
                    </DialogHeader>
                    <MacroSettingsForm
                        targets={targets}
                        onSave={handleSaveMacros}
                        onCancel={() => setIsMacroSettingsOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Macro Settings Form Component
interface MacroTargets {
    calories: number
    protein: number
    carbs: number
    fats: number
}

function MacroSettingsForm({
    targets,
    onSave,
    onCancel
}: {
    targets: MacroTargets
    onSave: (newTargets: MacroTargets) => void
    onCancel: () => void
}) {
    const [values, setValues] = useState(targets)

    return (
        <div className="space-y-4 pt-2">
            {[
                { key: "calories", label: "Calorías", unit: "kcal", step: 50 },
                { key: "protein", label: "Proteína", unit: "g", step: 5 },
                { key: "carbs", label: "Carbohidratos", unit: "g", step: 10 },
                { key: "fats", label: "Grasas", unit: "g", step: 5 },
            ].map((field) => (
                <div key={field.key} className="space-y-1">
                    <label className="text-sm font-medium">{field.label}</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            step={field.step}
                            value={values[field.key as keyof typeof values]}
                            onChange={(e) => setValues(v => ({ ...v, [field.key]: parseInt(e.target.value) || 0 }))}
                            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                        />
                        <span className="text-sm text-muted-foreground w-10">{field.unit}</span>
                    </div>
                </div>
            ))}
            <div className="flex gap-2 pt-2">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={() => onSave(values)}
                    className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Guardar
                </button>
            </div>
        </div>
    )
}
