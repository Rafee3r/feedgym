"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Flame, Camera, Settings2, ShoppingCart, Heart, Clock, ChefHat, X, BookmarkPlus, Sun, Utensils, Moon, Cookie, Check, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { CalendarStrip } from "@/components/cuerpo/CalendarStrip"
import { MealCard } from "@/components/cuerpo/MealCard"
import { RecommendationsCarousel } from "@/components/cuerpo/RecommendationsCarousel"
import { ShoppingListModal } from "@/components/cuerpo/ShoppingListModal"
import { MealType } from "@/types"
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

// Recipe detail type
interface RecipeDetail {
    id: string
    name: string
    calories: number
    protein: number
    carbs: number
    fats: number
    prepTime: number
    ingredients: string[]
    instructions: string[]
    tags: string[]
}

export default function CuerpoPage() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const router = useRouter()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isAddFoodOpen, setIsAddFoodOpen] = useState(false)
    const [isShoppingListOpen, setIsShoppingListOpen] = useState(false)
    const [isMacroSettingsOpen, setIsMacroSettingsOpen] = useState(false)
    const [activeMealType, setActiveMealType] = useState<MealType>(MealType.BREAKFAST)

    // Navigate to IRON chat with pre-filled message
    const handleAskIron = (question: string) => {
        router.push(`/coach?message=${encodeURIComponent(question)}`)
    }

    // Recipe detail modal
    const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null)
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)

    const { dailyLog, isLoading, refresh } = useNutrition(selectedDate)

    // Nutrition streak - fetch from API
    const [streak, setStreak] = useState(0)

    useEffect(() => {
        const fetchStreak = async () => {
            try {
                const res = await fetch('/api/nutrition/streak')
                if (res.ok) {
                    const data = await res.json()
                    setStreak(data.streak || 0)
                }
            } catch (error) {
                console.error('Failed to fetch streak:', error)
            }
        }
        fetchStreak()
    }, [selectedDate])

    // User targets - calculated based on weight and goal
    const [targets, setTargets] = useState({
        calories: 2000,
        protein: 140,
        carbs: 250,
        fats: 65
    })

    // Fetch user profile and stored targets
    useEffect(() => {
        const fetchUserAndTargets = async () => {
            try {
                // We use /api/users/me because it includes the specific target fields we added
                const res = await fetch('/api/users/me')
                if (!res.ok) return

                const user = await res.json()

                // If user has specific targets saved (and they are not just the schema defaults if we want to be strict, 
                // but usually we trust the DB values), use them.
                // We trust the DB values because handleSaveMacros updates them.

                if (user.caloriesTarget) {
                    setTargets({
                        calories: user.caloriesTarget,
                        protein: user.proteinTarget,
                        carbs: user.carbsTarget,
                        fats: user.fatsTarget
                    })
                } else {
                    // Fallback calculation only if no targets exist (legacy support)
                    const weight = user.weight || 70
                    const goal = user.goal || 'MAINTAIN'
                    const baseTDEE = weight * 24 * 1.5
                    let targetCalories = Math.round(baseTDEE)
                    if (goal === 'CUT') targetCalories -= 500
                    if (goal === 'BULK') targetCalories += 400

                    const protein = Math.round(weight * 2)
                    const fats = Math.round((targetCalories * 0.25) / 9)
                    const carbs = Math.round((targetCalories - (protein * 4) - (fats * 9)) / 4)

                    setTargets({
                        calories: targetCalories,
                        protein: Math.max(protein, 100),
                        carbs: Math.max(carbs, 100),
                        fats: Math.max(fats, 40)
                    })
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error)
            }
        }

        fetchUserAndTargets()
    }, [])

    const handleAddFood = (type: MealType) => {
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

    // Handle clicking on a recommended meal - show recipe details
    const handleMealClick = async (meal: any) => {
        // Generate recipe details (in production, fetch from API)
        const recipeDetail: RecipeDetail = {
            id: meal.id,
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            prepTime: meal.prepTime || 15,
            ingredients: generateIngredients(meal.name),
            instructions: generateInstructions(meal.name),
            tags: meal.tags || []
        }
        setSelectedRecipe(recipeDetail)
        setIsRecipeModalOpen(true)
    }

    // Add recipe to log
    const handleAddRecipeToLog = async () => {
        if (!selectedRecipe) return

        await handleFoodAdded({
            name: selectedRecipe.name,
            calories: selectedRecipe.calories,
            protein: selectedRecipe.protein,
            carbs: selectedRecipe.carbs,
            fats: selectedRecipe.fats,
        })
        setIsRecipeModalOpen(false)
    }

    // Save recipe to favorites
    const handleSaveToFavorites = async () => {
        if (!selectedRecipe) return

        try {
            await fetch('/api/nutrition/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipeId: selectedRecipe.id, name: selectedRecipe.name })
            })
            toast({ title: "💜 Agregado a favoritos" })
        } catch (error) {
            console.error('Failed to save favorite:', error)
        }
    }

    const handleQuickAdd = async (item: any) => {
        const hour = new Date().getHours()
        let mealType: MealType = MealType.BREAKFAST
        if (hour >= 11 && hour < 15) mealType = MealType.LUNCH
        else if (hour >= 15 && hour < 18) mealType = MealType.SNACK
        else if (hour >= 18) mealType = MealType.DINNER

        setActiveMealType(mealType)

        // Show recipe detail instead of adding directly
        handleMealClick(item)
    }

    const handleRecommend = async (type: MealType) => {
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
                handleMealClick(suggestion)
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
                        unit: "serving"
                    }
                })
            })
            toast({ title: "Repetido para mañana" })
        } catch (error) {
            console.error("Failed to repeat entry", error)
        }
    }

    const handleScanFood = () => {
        setActiveMealType(MealType.BREAKFAST)
        setIsAddFoodOpen(true)
    }

    const handleSaveMacros = async (newTargets: MacroTargets) => {
        try {
            const res = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    caloriesTarget: newTargets.calories,
                    proteinTarget: newTargets.protein,
                    carbsTarget: newTargets.carbs,
                    fatsTarget: newTargets.fats
                })
            })

            if (res.ok) {
                setTargets(newTargets)
                setIsMacroSettingsOpen(false)
                toast({ title: "Metas actualizadas y guardadas" })
                // Refresh data to ensure everything is in sync
                await refresh()
            } else {
                throw new Error("Error al guardar metas")
            }
        } catch (error) {
            console.error("Failed to save macros", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron guardar las metas"
            })
        }
    }

    const getMealData = (type: MealType) => {
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
        <div className="min-h-screen bg-background">
            {/* Sticky Header with PWA Safe Area */}
            <div
                className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border"
                style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
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
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleScanFood}
                            className="p-2.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Escanear comida"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsShoppingListOpen(true)}
                            className="p-2.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Lista de compras"
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

            {/* Main Content with proper bottom padding for PWA */}
            <div
                className="max-w-lg mx-auto px-4 py-4 space-y-6"
                style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
            >
                {/* Weekly Progress Bar */}
                <div className="bg-card/50 border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                            <Flame className="w-3 h-3 text-primary" />
                        </div>
                        <span className="font-semibold text-sm">Meta Semanal</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (streak / 7) * 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        {streak > 0 ? `${Math.round((streak / 7) * 100)}% Completado` : 'Empieza a registrar'}
                    </p>
                </div>

                {/* Circular Calorie Tracker + Macros */}
                <div className="flex items-center gap-6">
                    {/* Circular Tracker */}
                    <div className="relative w-40 h-40 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-muted/30"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="url(#calorieGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${Math.min(100, (stats.calories / targets.calories) * 100) * 2.64} 264`}
                                className="transition-all duration-700"
                            />
                            <defs>
                                <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#22c55e" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xs text-muted-foreground">Hoy:</span>
                            <span className="text-2xl font-bold">{stats.calories}</span>
                            <span className="text-xs text-muted-foreground">/{targets.calories} kcal</span>
                        </div>
                    </div>

                    {/* Macros List */}
                    <div className="flex-1 space-y-3">
                        {[
                            { label: "Proteína", current: stats.protein, target: targets.protein, color: "text-blue-500", icon: "💪" },
                            { label: "Carbs", current: stats.carbs, target: targets.carbs, color: "text-amber-500", icon: "⚡" },
                            { label: "Grasas", current: stats.fats, target: targets.fats, color: "text-rose-500", icon: "🔥" },
                        ].map((macro) => (
                            <div key={macro.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={cn("font-medium text-sm", macro.color)}>{macro.label}</span>
                                </div>
                                <span className="text-sm font-semibold tabular-nums">
                                    {macro.current}<span className="text-muted-foreground font-normal">/{macro.target}g</span>
                                </span>
                            </div>
                        ))}
                        <button
                            onClick={() => setIsMacroSettingsOpen(true)}
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                        >
                            <Settings2 className="w-3 h-3" />
                            Ajustar metas
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Registrar Comida</span>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleScanFood}
                                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Camera className="w-5 h-5" />
                                <span className="text-[10px]">Escanear</span>
                            </button>
                            <button
                                onClick={() => handleAddFood(MealType.BREAKFAST)}
                                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ChefHat className="w-5 h-5" />
                                <span className="text-[10px]">Buscar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Meal Cards - Original Design */}
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

                {/* Inspiration Feed */}
                <RecommendationsCarousel
                    onSelect={handleQuickAdd}
                    onScanFood={handleScanFood}
                />

                {/* Ask IRON Section */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-sm px-1 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Preguntar a IRON
                    </h3>
                    <div className="flex flex-col gap-2">
                        {[
                            "¿Qué me recomiendas comer?",
                            "¿Cómo ves mi dieta de hoy?",
                            "Me resulta difícil mi dieta"
                        ].map((question) => (
                            <button
                                key={question}
                                onClick={() => handleAskIron(question)}
                                className="w-full text-left px-4 py-3 bg-card border border-border rounded-xl text-sm hover:bg-muted/50 hover:border-primary/30 transition-all flex items-center justify-between group"
                            >
                                <span>{question}</span>
                                <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>
                        ))}
                    </div>
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
                            <Settings2 className="w-5 h-5 text-primary" />
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

            {/* Recipe Detail Modal */}
            <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
                <DialogContent className="sm:max-w-md max-h-[85vh] p-0 gap-0 overflow-hidden">
                    {selectedRecipe && (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-border">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h2 className="font-bold text-lg">{selectedRecipe.name}</h2>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {selectedRecipe.prepTime} min
                                            </span>
                                            <span className="text-orange-500 font-medium">
                                                {selectedRecipe.calories} kcal
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Macros Row */}
                                <div className="flex gap-4 mt-3">
                                    {[
                                        { label: "Prot", value: selectedRecipe.protein, color: "text-blue-500" },
                                        { label: "Carbs", value: selectedRecipe.carbs, color: "text-amber-500" },
                                        { label: "Grasas", value: selectedRecipe.fats, color: "text-rose-500" },
                                    ].map((m) => (
                                        <div key={m.label} className="text-center">
                                            <p className={cn("font-bold", m.color)}>{m.value}g</p>
                                            <p className="text-[10px] text-muted-foreground">{m.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh]">
                                {/* Ingredients */}
                                <div>
                                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4" />
                                        Ingredientes
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {selectedRecipe.ingredients.map((ing, i) => (
                                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <span className="text-primary">•</span>
                                                {ing}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Instructions */}
                                <div>
                                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <ChefHat className="w-4 h-4" />
                                        Preparación
                                    </h3>
                                    <ol className="space-y-2">
                                        {selectedRecipe.instructions.map((step, i) => (
                                            <li key={i} className="text-sm text-muted-foreground flex gap-3">
                                                <span className="font-bold text-foreground shrink-0">{i + 1}.</span>
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-4 border-t border-border flex gap-2">
                                <button
                                    onClick={handleSaveToFavorites}
                                    className="flex-1 py-3 flex items-center justify-center gap-2 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
                                >
                                    <Heart className="w-4 h-4" />
                                    Guardar receta
                                </button>
                                <button
                                    onClick={handleAddRecipeToLog}
                                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Agregar al diario
                                </button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Helper functions to generate recipe details
function generateIngredients(mealName: string): string[] {
    const commonIngredients: Record<string, string[]> = {
        default: ["Ingredientes según preferencia", "Sal y pimienta al gusto", "Aceite de oliva"]
    }

    if (mealName.toLowerCase().includes("huevo")) {
        return ["2 huevos", "1 cucharada de aceite", "Sal y pimienta", "Hierbas al gusto"]
    }
    if (mealName.toLowerCase().includes("avena")) {
        return ["1/2 taza de avena", "1 taza de leche", "1 plátano", "Miel al gusto", "Canela"]
    }
    if (mealName.toLowerCase().includes("pollo")) {
        return ["200g de pechuga de pollo", "Limón", "Ajo", "Especias al gusto", "Aceite de oliva"]
    }
    if (mealName.toLowerCase().includes("ensalada")) {
        return ["Lechuga fresca", "Tomate", "Pepino", "Aceite de oliva", "Vinagre balsámico"]
    }
    if (mealName.toLowerCase().includes("batido") || mealName.toLowerCase().includes("proteína")) {
        return ["1 scoop de proteína", "1 taza de leche", "1 plátano", "Hielo", "Mantequilla de maní (opcional)"]
    }

    return commonIngredients.default
}

function generateInstructions(mealName: string): string[] {
    if (mealName.toLowerCase().includes("huevo")) {
        return [
            "Calienta el aceite en una sartén a fuego medio",
            "Bate los huevos con sal y pimienta",
            "Vierte en la sartén y revuelve suavemente",
            "Cocina hasta obtener la textura deseada",
            "Sirve inmediatamente"
        ]
    }
    if (mealName.toLowerCase().includes("avena")) {
        return [
            "Calienta la leche en una olla",
            "Agrega la avena y cocina a fuego medio 5 minutos",
            "Revuelve ocasionalmente",
            "Sirve con plátano en rodajas y miel",
            "Espolvorea canela al gusto"
        ]
    }
    if (mealName.toLowerCase().includes("batido") || mealName.toLowerCase().includes("proteína")) {
        return [
            "Agrega todos los ingredientes a la licuadora",
            "Licúa por 30-45 segundos hasta que esté suave",
            "Ajusta la consistencia con más leche si es necesario",
            "Sirve inmediatamente"
        ]
    }

    return [
        "Prepara todos los ingredientes",
        "Sigue las instrucciones del paquete o receta base",
        "Cocina hasta que esté listo",
        "Sirve y disfruta"
    ]
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
                            value={values[field.key as keyof MacroTargets]}
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
