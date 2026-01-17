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

    // ENSALADAS
    if (name.includes("ensalada") && name.includes("pollo")) {
        return ["200g pechuga de pollo", "2 tazas de lechuga mixta", "1 manzana verde en cubos", "1/4 taza de nueces", "2 cdas de queso feta", "Vinagreta de miel y mostaza"]
    }
    if (name.includes("ensalada") && name.includes("atún")) {
        return ["1 lata de atún en agua", "2 tazas de lechuga", "1/2 pepino", "Cherry tomates", "1/4 cebolla morada", "Aceite de oliva y limón"]
    }
    if (name.includes("ensalada")) {
        return ["3 tazas de hojas verdes mixtas", "1/2 taza de tomate cherry", "1/4 pepino en rodajas", "1/4 taza de zanahoria rallada", "2 cdas aceite de oliva", "1 cda vinagre balsámico", "Sal y pimienta"]
    }

    // POLLO
    if (name.includes("pollo") && name.includes("arroz")) {
        return ["200g pechuga de pollo", "1 taza de arroz", "1/2 cebolla", "2 dientes de ajo", "1 pimiento", "Caldo de pollo", "Especias al gusto"]
    }
    if (name.includes("pollo") && (name.includes("grill") || name.includes("plancha"))) {
        return ["250g pechuga de pollo", "2 cdas aceite de oliva", "Jugo de 1 limón", "2 dientes de ajo", "Orégano, comino, pimentón", "Sal y pimienta"]
    }
    if (name.includes("pollo")) {
        return ["200g pechuga de pollo", "1 cda aceite de oliva", "1/2 limón", "Ajo en polvo", "Hierbas provenzales", "Sal y pimienta", "Verduras al vapor (opcional)"]
    }

    // CARNE / RES
    if (name.includes("carne") || name.includes("res") || name.includes("bistec")) {
        return ["200g carne magra", "1 cda aceite de oliva", "2 dientes de ajo", "Romero fresco", "Sal gruesa y pimienta", "1 cda mantequilla (opcional)"]
    }

    // PESCADO
    if (name.includes("salmón") || name.includes("salmon")) {
        return ["180g filete de salmón", "1 cda aceite de oliva", "Jugo de limón", "Eneldo fresco", "Sal y pimienta", "Espárragos o brócoli"]
    }
    if (name.includes("atún") && !name.includes("ensalada")) {
        return ["180g filete de atún", "2 cdas salsa de soya", "1 cda miel", "Sésamo", "Jengibre rallado", "Aceite de sésamo"]
    }

    // ARROZ
    if (name.includes("arroz") && !name.includes("pollo")) {
        return ["1 taza de arroz", "2 tazas de agua o caldo", "1 cda aceite", "1/2 cebolla", "Sal al gusto", "Verduras picadas (opcional)"]
    }

    // PASTA
    if (name.includes("pasta")) {
        return ["100g pasta integral", "2 cdas aceite de oliva", "2 dientes de ajo", "Tomates cherry", "Albahaca fresca", "Queso parmesano", "Sal y pimienta"]
    }

    // WRAPS / BURRITOS
    if (name.includes("wrap") || name.includes("burrito")) {
        return ["1-2 tortillas integrales", "150g proteína (pollo/carne/tofu)", "1/2 taza arroz", "1/4 taza frijoles negros", "Vegetales picados", "Salsa o guacamole"]
    }

    // QUINOA
    if (name.includes("quinoa") || name.includes("quinua")) {
        return ["1/2 taza de quinoa", "1 taza de agua", "1/2 pepino", "Tomate cherry", "1/4 taza de garbanzos", "Aceite de oliva y limón", "Hierbas frescas"]
    }

    // AVENA
    if (name.includes("avena")) {
        return ["1/2 taza de avena", "1 taza de leche", "1 plátano maduro", "1 cda de miel", "Canela al gusto", "Mantequilla de maní (opcional)"]
    }

    // PANQUEQUES
    if (name.includes("panqueque") || name.includes("pancake")) {
        return ["2 huevos", "1/2 taza de harina de avena", "1/4 taza de leche", "1 cdita de polvo de hornear", "Tocino o jamón (opcional)", "Sirope sin azúcar"]
    }

    // HUEVOS
    if (name.includes("huevo") && name.includes("revuelto")) {
        return ["3 huevos", "1 cda mantequilla", "2 cdas leche", "Sal y pimienta", "Cebollín picado", "Pan integral tostado"]
    }
    if (name.includes("omelette") || name.includes("omelet") || name.includes("tortilla")) {
        return ["3 huevos", "1/4 taza de queso rallado", "1/4 taza de verduras picadas", "1 cda de aceite", "Sal y pimienta", "Hierbas al gusto"]
    }
    if (name.includes("huevo")) {
        return ["2-3 huevos", "1 cda aceite o mantequilla", "Sal y pimienta", "Pan integral", "Verduras opcionales"]
    }

    // BATIDOS / SMOOTHIES
    if (name.includes("batido") || name.includes("smoothie") || name.includes("proteína")) {
        return ["1 scoop proteína de suero", "1 taza de leche o agua", "1 plátano", "1/2 taza de avena", "Hielo al gusto", "1 cda mantequilla de maní"]
    }

    // TOSTADAS
    if (name.includes("tostada") && name.includes("aguacate")) {
        return ["2 rebanadas de pan integral", "1/2 aguacate maduro", "2 huevos", "Sal, pimienta y limón", "Semillas de chía", "Hojuelas de chile (opcional)"]
    }
    if (name.includes("tostada")) {
        return ["2 rebanadas de pan integral", "Topping al gusto", "1 cda mantequilla o aceite", "Sal y pimienta"]
    }

    // YOGURT / GRANOLA
    if (name.includes("yogurt") || name.includes("granola")) {
        return ["1 taza de yogurt griego", "1/4 taza de granola", "Frutas frescas variadas", "1 cda de miel", "Semillas de chía"]
    }

    // SANDWICH
    if (name.includes("sandwich") || name.includes("sándwich")) {
        return ["2 rebanadas de pan integral", "Proteína (jamón/pavo/atún)", "Lechuga y tomate", "1/4 aguacate", "Mostaza o mayonesa ligera", "Queso bajo en grasa"]
    }

    // CLARAS / ESPINACA
    if (name.includes("claras") || (name.includes("huevo") && name.includes("espinaca"))) {
        return ["4 claras de huevo", "1 taza de espinaca fresca", "1/4 cebolla picada", "Sal y pimienta", "Aceite en spray"]
    }

    // DEFAULT MEJORADO
    return ["Proteína principal según receta", "Vegetales frescos al gusto", "1-2 cdas aceite de oliva", "Condimentos y especias", "Sal y pimienta al gusto"]
}

function generateInstructions(mealName: string): string[] {
    const name = mealName.toLowerCase()

    // ENSALADAS
    if (name.includes("ensalada") && name.includes("pollo")) {
        return [
            "Sazona el pollo con sal, pimienta y hierbas. Cocina a la plancha 6-7 min por lado hasta dorar",
            "Deja reposar el pollo 3 minutos y córtalo en tiras",
            "En un bowl grande, mezcla la lechuga, manzana en cubos y nueces",
            "Prepara la vinagreta mezclando miel, mostaza, aceite y vinagre",
            "Agrega el pollo sobre la ensalada, espolvorea queso feta y rocía la vinagreta"
        ]
    }
    if (name.includes("ensalada") && name.includes("atún")) {
        return [
            "Escurre bien el atún y desmenúzalo con un tenedor",
            "Lava y seca las hojas de lechuga, córtalas si es necesario",
            "Corta el pepino en rodajas finas y los tomates por la mitad",
            "Pica la cebolla morada en juliana fina",
            "Mezcla todo en un bowl, aliña con aceite de oliva y limón al gusto"
        ]
    }
    if (name.includes("ensalada")) {
        return [
            "Lava y seca bien todas las hojas verdes",
            "Corta los vegetales en trozos del tamaño deseado",
            "Combina todos los ingredientes en un bowl grande",
            "Prepara el aderezo mezclando aceite, vinagre, sal y pimienta",
            "Vierte el aderezo justo antes de servir y mezcla bien"
        ]
    }

    // POLLO
    if (name.includes("pollo") && name.includes("arroz")) {
        return [
            "Corta el pollo en cubos y sazona con sal, pimienta y tus especias favoritas",
            "Dora el pollo en una sartén con aceite, luego reserva",
            "En la misma sartén, sofríe cebolla, ajo y pimiento picados",
            "Agrega el arroz, revuelve 1 minuto, luego añade el caldo caliente",
            "Incorpora el pollo, tapa y cocina a fuego bajo 18-20 minutos hasta que el arroz esté listo"
        ]
    }
    if (name.includes("pollo") && (name.includes("grill") || name.includes("plancha"))) {
        return [
            "Marina el pollo con aceite, limón, ajo y especias por 15-30 minutos",
            "Calienta una sartén grill o plancha a fuego medio-alto",
            "Cocina el pollo 5-7 minutos por lado sin moverlo para lograr marcas",
            "El pollo está listo cuando el centro alcanza 75°C o los jugos salen claros",
            "Deja reposar 3 minutos antes de servir para que quede jugoso"
        ]
    }
    if (name.includes("pollo")) {
        return [
            "Sazona el pollo con aceite, limón, ajo y especias al gusto",
            "Calienta una sartén a fuego medio con un poco de aceite",
            "Cocina el pollo 5-7 minutos por cada lado hasta que esté dorado",
            "Verifica que esté cocido por dentro (sin rosado)",
            "Sirve con verduras al vapor o ensalada"
        ]
    }

    // CARNE
    if (name.includes("carne") || name.includes("res") || name.includes("bistec")) {
        return [
            "Saca la carne del refrigerador 20 minutos antes de cocinar",
            "Sazona generosamente con sal gruesa y pimienta de ambos lados",
            "Calienta la sartén a fuego alto con aceite hasta que humee ligeramente",
            "Sella la carne 3-4 minutos por lado (término medio) sin moverla",
            "Retira, agrega mantequilla y ajo, deja reposar 5 minutos antes de cortar"
        ]
    }

    // PESCADO
    if (name.includes("salmón") || name.includes("salmon")) {
        return [
            "Sazona el salmón con sal, pimienta y un toque de limón",
            "Calienta aceite en una sartén a fuego medio-alto",
            "Coloca el salmón con la piel hacia abajo, cocina 4-5 minutos",
            "Voltea cuidadosamente y cocina 2-3 minutos más",
            "El centro debe estar rosado y jugoso. Sirve con eneldo y espárragos"
        ]
    }
    if (name.includes("atún") && !name.includes("ensalada")) {
        return [
            "Mezcla soya, miel, jengibre y aceite de sésamo para la marinada",
            "Cubre el atún con la marinada por 10-15 minutos",
            "Calienta una sartén muy fuerte (casi humeando)",
            "Sella el atún 1-2 minutos por lado (debe quedar rosado por dentro)",
            "Corta en láminas, espolvorea sésamo y sirve inmediatamente"
        ]
    }

    // PASTA
    if (name.includes("pasta")) {
        return [
            "Hierve agua con sal abundante y cocina la pasta según el paquete",
            "Mientras tanto, sofríe ajo picado en aceite de oliva a fuego bajo",
            "Corta los tomates cherry por la mitad y añádelos a la sartén",
            "Escurre la pasta reservando 1/2 taza del agua de cocción",
            "Mezcla la pasta con la salsa, agrega agua de cocción si es necesario, corona con albahaca y parmesano"
        ]
    }

    // WRAPS / BURRITOS
    if (name.includes("wrap") || name.includes("burrito")) {
        return [
            "Cocina y sazona la proteína a tu gusto (pollo, carne o tofu)",
            "Calienta ligeramente la tortilla para que sea más flexible",
            "Coloca el arroz, proteína y frijoles en línea en el centro",
            "Añade los vegetales y la salsa de tu preferencia",
            "Dobla los extremos hacia adentro y enrolla firmemente"
        ]
    }

    // QUINOA
    if (name.includes("quinoa") || name.includes("quinua")) {
        return [
            "Enjuaga la quinoa bajo agua fría para quitar amargor",
            "Cocina en agua hirviendo 15 minutos hasta que esté esponjosa",
            "Deja enfriar y esponja con un tenedor",
            "Mezcla con pepino, tomate, garbanzos y hierbas",
            "Aliña con aceite de oliva y limón, sazona al gusto"
        ]
    }

    // AVENA
    if (name.includes("avena")) {
        return [
            "Calienta la leche en una olla a fuego medio",
            "Agrega la avena y revuelve constantemente por 3-4 minutos",
            "Cuando espese, retira del fuego",
            "Sirve en un bowl y agrega el plátano en rodajas",
            "Añade miel, canela y mantequilla de maní al gusto"
        ]
    }

    // PANQUEQUES
    if (name.includes("panqueque") || name.includes("pancake")) {
        return [
            "Mezcla todos los ingredientes secos en un bowl",
            "Añade los huevos y la leche, mezcla hasta obtener una masa homogénea",
            "Calienta una sartén antiadherente a fuego medio",
            "Vierte porciones de masa y cocina 2 min por lado hasta dorar",
            "Sirve con tocino o jamón y sirope"
        ]
    }

    // HUEVOS
    if (name.includes("huevo") && name.includes("revuelto")) {
        return [
            "Bate los huevos con leche, sal y pimienta",
            "Derrite mantequilla en una sartén a fuego medio-bajo",
            "Vierte los huevos y espera 20 segundos",
            "Revuelve suavemente desde los bordes hacia el centro",
            "Retira cuando estén cremosos (no secos), sirve con pan tostado y cebollín"
        ]
    }
    if (name.includes("omelette") || name.includes("omelet") || name.includes("tortilla")) {
        return [
            "Bate los huevos con sal y pimienta",
            "Calienta aceite en sartén antiadherente a fuego medio",
            "Vierte los huevos y deja que cuajen en los bordes",
            "Añade queso y verduras en la mitad del omelette",
            "Dobla por la mitad cuando esté casi cuajado, cocina 1 minuto más"
        ]
    }
    if (name.includes("huevo")) {
        return [
            "Calienta mantequilla o aceite en una sartén a fuego medio",
            "Casca los huevos cuidadosamente en la sartén",
            "Sazona con sal y pimienta al gusto",
            "Cocina al punto deseado (estrellados, revueltos, etc.)",
            "Sirve inmediatamente con pan o acompañamiento"
        ]
    }

    // BATIDOS
    if (name.includes("batido") || name.includes("smoothie") || name.includes("proteína")) {
        return [
            "Agrega la leche y el plátano a la licuadora",
            "Añade la proteína en polvo y la avena",
            "Licúa por 30-45 segundos hasta que esté suave",
            "Agrega hielo y mantequilla de maní",
            "Licúa 15 segundos más y sirve inmediatamente"
        ]
    }

    // TOSTADAS
    if (name.includes("tostada")) {
        return [
            "Tuesta el pan hasta que esté crujiente y dorado",
            "Machaca el aguacate con limón, sal y pimienta",
            "Prepara los huevos al gusto (poché, revueltos o fritos)",
            "Unta el aguacate sobre las tostadas calientes",
            "Coloca los huevos encima y decora con semillas y especias"
        ]
    }

    // YOGURT / GRANOLA
    if (name.includes("yogurt") || name.includes("granola")) {
        return [
            "Coloca el yogurt griego en un bowl",
            "Añade la granola por encima",
            "Corta las frutas frescas en trozos",
            "Decora con las frutas y las semillas",
            "Agrega miel al gusto y sirve inmediatamente"
        ]
    }

    // SANDWICH
    if (name.includes("sandwich") || name.includes("sándwich")) {
        return [
            "Tuesta ligeramente el pan si lo deseas",
            "Unta mostaza o mayonesa ligera en ambos panes",
            "Coloca las hojas de lechuga como base",
            "Añade la proteína, tomate en rodajas y aguacate",
            "Cierra el sandwich, corta en diagonal y sirve"
        ]
    }

    // DEFAULT MEJORADO
    return [
        "Reúne y prepara todos los ingredientes (lavados y cortados)",
        "Sazona la proteína con sal, pimienta y especias al gusto",
        "Cocina la proteína en sartén caliente hasta el punto deseado",
        "Prepara o calienta los acompañamientos según corresponda",
        "Sirve caliente con los acompañamientos y disfruta"
    ]
}

