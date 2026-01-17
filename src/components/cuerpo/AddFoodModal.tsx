"use client"

import { useState, useEffect } from "react"
import { Camera, Loader2, Clock, Flame, RefreshCw, Sparkles, Wand2, ChevronLeft, Heart, BookmarkPlus, ChefHat, ShoppingCart } from "lucide-react"
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

interface RecipeDetail {
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

    // Recipe detail view state
    const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null)
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')

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

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true)
            setViewMode('list')
            setSelectedRecipe(null)
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

    // Show recipe details
    const handleShowDetails = (meal: Meal | YesterdayMeal) => {
        const recipeDetail: RecipeDetail = {
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            prepTime: 'prepTime' in meal ? meal.prepTime : 10,
            ingredients: generateIngredients(meal.name),
            instructions: generateInstructions(meal.name),
            tags: 'tags' in meal ? meal.tags : []
        }
        setSelectedRecipe(recipeDetail)
        setViewMode('detail')
    }

    // Add the selected recipe
    const handleAddRecipe = async () => {
        if (!selectedRecipe) return

        setAddingId(selectedRecipe.name)
        try {
            await onAddFood({
                name: selectedRecipe.name,
                calories: selectedRecipe.calories,
                protein: selectedRecipe.protein,
                carbs: selectedRecipe.carbs,
                fats: selectedRecipe.fats,
                mealType,
            })
            onClose()
        } finally {
            setAddingId(null)
        }
    }

    // Save to favorites
    const handleSaveToFavorites = async () => {
        if (!selectedRecipe) return
        try {
            await fetch('/api/nutrition/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: selectedRecipe.name })
            })
        } catch (error) {
            console.error('Failed to save favorite:', error)
        }
    }

    // AI Scan Food
    const handleAIScan = async () => {
        setIsScanning(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            const video = document.createElement('video')
            video.srcObject = stream
            await video.play()

            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            canvas.getContext('2d')?.drawImage(video, 0, 0)
            stream.getTracks().forEach(track => track.stop())

            const imageData = canvas.toDataURL('image/jpeg', 0.8)

            const res = await fetch('/api/ai/analyze-food', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            })

            if (res.ok) {
                const foodData = await res.json()
                handleShowDetails(foodData)
            }
        } catch (error) {
            console.error('Scan failed:', error)
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
                handleShowDetails(suggestion)
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
                {/* Header */}
                <DialogHeader className="p-4 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {viewMode === 'detail' && (
                                <button
                                    onClick={() => setViewMode('list')}
                                    className="p-1 hover:bg-accent rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}
                            <span>
                                {viewMode === 'list'
                                    ? `Agregar ${getMealLabel(mealType)}`
                                    : selectedRecipe?.name
                                }
                            </span>
                        </div>
                        <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded-full">
                            Meta: {getGoalLabel(userGoal)}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {viewMode === 'list' ? (
                        <>
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
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
                                        {/* Yesterday's meals */}
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
                                                            onClick={() => handleShowDetails(meal)}
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
                                                        onClick={() => handleShowDetails(meal)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-3 rounded-xl border border-border",
                                                            "hover:border-primary/50 hover:bg-accent/30 transition-all text-left"
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
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                                                                <span className="text-lg font-light">+</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Recipe Detail View */
                        selectedRecipe && (
                            <div className="flex flex-col h-full">
                                {/* Macro Summary */}
                                <div className="p-4 bg-muted/30 border-b border-border">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            <span>{selectedRecipe.prepTime} min</span>
                                        </div>
                                        <span className="text-orange-500 font-bold text-lg">
                                            {selectedRecipe.calories} kcal
                                        </span>
                                    </div>

                                    {/* Macros Row */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: "Proteína", value: selectedRecipe.protein, color: "text-blue-500", bg: "bg-blue-500/10" },
                                            { label: "Carbohidratos", value: selectedRecipe.carbs, color: "text-amber-500", bg: "bg-amber-500/10" },
                                            { label: "Grasas", value: selectedRecipe.fats, color: "text-rose-500", bg: "bg-rose-500/10" },
                                        ].map((m) => (
                                            <div key={m.label} className={cn("text-center py-2 rounded-lg", m.bg)}>
                                                <p className={cn("font-bold text-lg", m.color)}>{m.value}g</p>
                                                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {/* Ingredients */}
                                    <div>
                                        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                            <ShoppingCart className="w-4 h-4 text-primary" />
                                            Ingredientes
                                        </h3>
                                        <ul className="space-y-1.5 bg-muted/30 rounded-lg p-3">
                                            {selectedRecipe.ingredients.map((ing, i) => (
                                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                    <span className="text-primary font-bold">•</span>
                                                    {ing}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Instructions */}
                                    <div>
                                        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                            <ChefHat className="w-4 h-4 text-primary" />
                                            Preparación
                                        </h3>
                                        <ol className="space-y-2 bg-muted/30 rounded-lg p-3">
                                            {selectedRecipe.instructions.map((step, i) => (
                                                <li key={i} className="text-sm text-muted-foreground flex gap-3">
                                                    <span className="font-bold text-primary shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-xs">{i + 1}</span>
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="p-4 border-t border-border flex gap-2 shrink-0">
                                    <button
                                        onClick={handleSaveToFavorites}
                                        className="flex-1 py-3 flex items-center justify-center gap-2 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
                                    >
                                        <BookmarkPlus className="w-4 h-4" />
                                        Guardar
                                    </button>
                                    <button
                                        onClick={handleAddRecipe}
                                        disabled={addingId === selectedRecipe.name}
                                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {addingId === selectedRecipe.name ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>Agregar</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Helper functions to generate recipe details
function generateIngredients(mealName: string): string[] {
    const name = mealName.toLowerCase()

    if (name.includes("avena")) {
        return ["1/2 taza de avena", "1 taza de leche", "1 plátano maduro", "1 cda de miel", "Canela al gusto", "Mantequilla de maní (opcional)"]
    }
    if (name.includes("panqueque") || name.includes("pancake")) {
        return ["2 huevos", "1/2 taza de harina de avena", "1/4 taza de leche", "1 cdita de polvo de hornear", "Tocino o jamón (opcional)", "Sirope sin azúcar"]
    }
    if (name.includes("huevo") && name.includes("pan")) {
        return ["2 huevos", "2 rebanadas de pan integral", "1 cda de mantequilla", "Sal y pimienta", "Hierbas frescas (opcional)"]
    }
    if (name.includes("sandwich")) {
        return ["2 rebanadas de pan integral", "2 huevos", "1/4 de aguacate", "Queso bajo en grasa", "Sal y pimienta"]
    }
    if (name.includes("batido") || name.includes("proteína")) {
        return ["1 scoop proteína de suero", "1 taza de leche o agua", "1 plátano", "1/2 taza de avena", "Hielo al gusto", "1 cda mantequilla de maní"]
    }
    if (name.includes("tostada")) {
        return ["2 rebanadas de pan integral", "1/2 aguacate", "2 huevos", "Sal, pimienta y limón", "Semillas de chía (opcional)"]
    }
    if (name.includes("yogurt") || name.includes("granola")) {
        return ["1 taza de yogurt griego", "1/4 taza de granola", "Frutas frescas variadas", "1 cda de miel", "Semillas de chía"]
    }
    if (name.includes("claras") || name.includes("espinaca")) {
        return ["4 claras de huevo", "1 taza de espinaca fresca", "1/4 cebolla picada", "Sal y pimienta", "Aceite en spray"]
    }
    if (name.includes("omelette")) {
        return ["3 huevos", "1/4 taza de queso rallado", "Verduras picadas", "1 cda de aceite", "Sal y pimienta"]
    }

    return ["Ingredientes según la receta", "Condimentos al gusto", "Aceite de oliva", "Sal y pimienta"]
}

function generateInstructions(mealName: string): string[] {
    const name = mealName.toLowerCase()

    if (name.includes("avena")) {
        return [
            "Calienta la leche en una olla a fuego medio",
            "Agrega la avena y revuelve constantemente por 3-4 minutos",
            "Cuando espese, retira del fuego",
            "Sirve en un bowl y agrega el plátano en rodajas",
            "Añade miel, canela y mantequilla de maní al gusto"
        ]
    }
    if (name.includes("panqueque") || name.includes("pancake")) {
        return [
            "Mezcla todos los ingredientes secos en un bowl",
            "Añade los huevos y la leche, mezcla hasta obtener una masa homogénea",
            "Calienta una sartén antiadherente a fuego medio",
            "Vierte porciones de masa y cocina 2 min por lado",
            "Sirve con tocino o jamón y sirope"
        ]
    }
    if (name.includes("huevo")) {
        return [
            "Calienta la mantequilla en una sartén a fuego medio-bajo",
            "Bate los huevos con sal y pimienta",
            "Vierte en la sartén y revuelve suavemente con espátula",
            "Cocina hasta que estén cremosos (no secos)",
            "Sirve sobre el pan tostado y añade hierbas"
        ]
    }
    if (name.includes("batido") || name.includes("proteína")) {
        return [
            "Agrega la leche y el plátano a la licuadora",
            "Añade la proteína y la avena",
            "Licúa por 30-45 segundos",
            "Agrega hielo y mantequilla de maní",
            "Licúa 15 segundos más y sirve inmediatamente"
        ]
    }
    if (name.includes("tostada")) {
        return [
            "Tuesta el pan hasta que esté crujiente",
            "Machaca el aguacate con limón, sal y pimienta",
            "Prepara los huevos al gusto (poché o revueltos)",
            "Unta el aguacate sobre las tostadas",
            "Coloca los huevos encima y añade semillas"
        ]
    }
    if (name.includes("yogurt") || name.includes("granola")) {
        return [
            "Coloca el yogurt griego en un bowl",
            "Añade la granola por encima",
            "Corta las frutas frescas en trozos",
            "Decora con las frutas y las semillas",
            "Agrega miel al gusto y sirve"
        ]
    }

    return [
        "Prepara todos los ingredientes",
        "Sigue el método de cocción apropiado",
        "Sazona al gusto durante la cocción",
        "Verifica que esté bien cocido",
        "Sirve caliente y disfruta"
    ]
}
