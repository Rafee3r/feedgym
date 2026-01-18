"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, Loader2, Clock, Flame, RefreshCw, Sparkles, Wand2, ChevronLeft, BookmarkPlus, ChefHat, ShoppingCart, X, Edit3, Check, Zap, ZapOff } from "lucide-react"
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

interface ScannedFood {
    name: string
    calories: number
    protein: number
    carbs: number
    fats: number
    imagePreview?: string
}

interface AddFoodModalProps {
    isOpen: boolean
    onClose: () => void
    mealType: string
    onAddFood: (foodItem: any) => void
}

// Determine meal type based on current local time
function getMealTypeByTime(): string {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 11) return "BREAKFAST"
    if (hour >= 11 && hour < 15) return "LUNCH"
    if (hour >= 15 && hour < 18) return "SNACK"
    return "DINNER"
}

export function AddFoodModal({ isOpen, onClose, mealType, onAddFood }: AddFoodModalProps) {
    const [meals, setMeals] = useState<Meal[]>([])
    const [yesterdayMeals, setYesterdayMeals] = useState<YesterdayMeal[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userGoal, setUserGoal] = useState<string>("MAINTAIN")
    const [addingId, setAddingId] = useState<string | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [isGeneratingAI, setIsGeneratingAI] = useState(false)
    const [isAISuggestion, setIsAISuggestion] = useState(false)

    // Recipe detail view state
    const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null)
    const [viewMode, setViewMode] = useState<'list' | 'detail' | 'camera' | 'edit'>('list')

    // Camera state
    const videoRef = useRef<HTMLVideoElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [flashEnabled, setFlashEnabled] = useState(false)
    const [zoomLevel, setZoomLevel] = useState(0)

    // Scanned food editable state
    const [scannedFood, setScannedFood] = useState<ScannedFood | null>(null)
    const [editedName, setEditedName] = useState("")
    const [editedCalories, setEditedCalories] = useState(0)
    const [editedProtein, setEditedProtein] = useState(0)
    const [editedCarbs, setEditedCarbs] = useState(0)
    const [editedFats, setEditedFats] = useState(0)

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

    // Cleanup camera when modal closes or view changes
    useEffect(() => {
        if (!isOpen || viewMode !== 'camera') {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
                setStream(null)
            }
        }
    }, [isOpen, viewMode])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [stream])

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true)
            setViewMode('list')
            setSelectedRecipe(null)
            setScannedFood(null)
            setCapturedImage(null)
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

    // Start camera
    const startCamera = async () => {
        try {
            setViewMode('camera')
            setZoomLevel(0)
            setFlashEnabled(false)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (error) {
            console.error('Camera access denied:', error)
            // Fallback to AI suggestion
            handleAIGenerate()
        }
    }

    // Toggle flash (torch mode)
    const toggleFlash = async () => {
        if (!stream) return
        try {
            const track = stream.getVideoTracks()[0]
            const capabilities = track.getCapabilities() as any
            if (capabilities.torch) {
                await track.applyConstraints({
                    advanced: [{ torch: !flashEnabled } as any]
                })
                setFlashEnabled(!flashEnabled)
            }
        } catch (error) {
            console.error('Flash toggle failed:', error)
        }
    }

    // Capture photo
    const capturePhoto = () => {
        if (!videoRef.current) return

        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)

        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)

        // Stop camera
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }

        // Analyze the image
        analyzeFood(imageData)
    }

    // Retake photo
    const retakePhoto = () => {
        setCapturedImage(null)
        setScannedFood(null)
        startCamera()
    }

    // Analyze food with AI
    const analyzeFood = async (imageData: string) => {
        setIsAnalyzing(true)
        try {
            const res = await fetch('/api/ai/analyze-food', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            })

            if (res.ok) {
                const foodData = await res.json()
                const scanned: ScannedFood = {
                    name: foodData.name || "Comida detectada",
                    calories: foodData.calories || 300,
                    protein: foodData.protein || 20,
                    carbs: foodData.carbs || 30,
                    fats: foodData.fats || 10,
                    imagePreview: imageData
                }
                setScannedFood(scanned)
                setEditedName(scanned.name)
                setEditedCalories(scanned.calories)
                setEditedProtein(scanned.protein)
                setEditedCarbs(scanned.carbs)
                setEditedFats(scanned.fats)
                setViewMode('edit')
            } else {
                throw new Error('Analysis failed')
            }
        } catch (error) {
            console.error('Food analysis failed:', error)
            // Set fallback values
            const fallback: ScannedFood = {
                name: "Comida escaneada",
                calories: 300,
                protein: 20,
                carbs: 30,
                fats: 10,
                imagePreview: imageData
            }
            setScannedFood(fallback)
            setEditedName(fallback.name)
            setEditedCalories(fallback.calories)
            setEditedProtein(fallback.protein)
            setEditedCarbs(fallback.carbs)
            setEditedFats(fallback.fats)
            setViewMode('edit')
        } finally {
            setIsAnalyzing(false)
        }
    }

    // Add scanned food with edited values
    const handleAddScannedFood = async () => {
        const effectiveMealType = mealType || getMealTypeByTime()

        setAddingId("scanned")
        try {
            await onAddFood({
                name: editedName,
                calories: editedCalories,
                protein: editedProtein,
                carbs: editedCarbs,
                fats: editedFats,
                mealType: effectiveMealType,
            })
            onClose()
        } finally {
            setAddingId(null)
        }
    }

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

    // AI Generate meal suggestion
    const handleAIGenerate = async (simpler = false) => {
        setIsGeneratingAI(true)
        try {
            const res = await fetch('/api/ai/recommend-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mealType, goal: userGoal, simpler })
            })

            if (res.ok) {
                const suggestion = await res.json()
                const recipeDetail: RecipeDetail = {
                    name: suggestion.name,
                    calories: suggestion.calories,
                    protein: suggestion.protein,
                    carbs: suggestion.carbs,
                    fats: suggestion.fats,
                    prepTime: suggestion.prepTime || 15,
                    ingredients: generateIngredients(suggestion.name),
                    instructions: generateInstructions(suggestion.name),
                    tags: suggestion.tags || []
                }
                setSelectedRecipe(recipeDetail)
                setIsAISuggestion(true)
                setViewMode('detail')
            }
        } catch (error) {
            console.error('AI generate failed:', error)
        } finally {
            setIsGeneratingAI(false)
        }
    }

    // Handle simpler option (quicker recipe)
    const handleSimpler = () => {
        handleAIGenerate(true)
    }

    // Handle regenerate (new suggestion)
    const handleRegenerate = () => {
        handleAIGenerate(false)
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

    const handleBack = () => {
        if (viewMode === 'camera' || viewMode === 'edit') {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
                setStream(null)
            }
            setCapturedImage(null)
            setScannedFood(null)
        }
        setViewMode('list')
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 bg-background overflow-hidden">
                {/* Header */}
                <DialogHeader className="p-4 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {(viewMode === 'detail' || viewMode === 'camera' || viewMode === 'edit') && (
                                <button
                                    onClick={handleBack}
                                    className="p-1 hover:bg-accent rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}
                            <span>
                                {viewMode === 'list' && `Agregar ${getMealLabel(mealType)}`}
                                {viewMode === 'camera' && "Escanear Comida"}
                                {viewMode === 'edit' && "Confirmar Comida"}
                                {viewMode === 'detail' && selectedRecipe?.name}
                            </span>
                        </div>
                        {viewMode === 'list' && (
                            <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded-full">
                                Meta: {getGoalLabel(userGoal)}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* CAMERA VIEW */}
                    {viewMode === 'camera' && (
                        <div className="flex flex-col" style={{ height: 'calc(85vh - 120px)', maxHeight: '550px' }}>
                            <div className="flex-1 bg-black relative overflow-hidden min-h-0">
                                {!capturedImage ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                            style={{ transform: `scale(${1 + zoomLevel / 100})` }}
                                        />
                                        {/* Camera overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-44 h-44 sm:w-56 sm:h-56 border-2 border-white/50 rounded-2xl" />
                                        </div>

                                        {/* Top controls - Flash */}
                                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                                            <button
                                                onClick={toggleFlash}
                                                className={cn(
                                                    "p-2.5 rounded-full backdrop-blur-sm transition-all",
                                                    flashEnabled
                                                        ? "bg-yellow-500 text-black"
                                                        : "bg-black/40 text-white"
                                                )}
                                            >
                                                {flashEnabled ? (
                                                    <Zap className="w-5 h-5 fill-current" />
                                                ) : (
                                                    <ZapOff className="w-5 h-5" />
                                                )}
                                            </button>

                                            {zoomLevel > 0 && (
                                                <span className="bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                                                    {(1 + zoomLevel / 100).toFixed(1)}x
                                                </span>
                                            )}
                                        </div>

                                        {/* Zoom slider */}
                                        <div className="absolute bottom-16 left-4 right-4">
                                            <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-2.5 flex items-center gap-3">
                                                <span className="text-white/60 text-xs font-medium">1x</span>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={zoomLevel}
                                                    onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                                                    className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-white"
                                                />
                                                <span className="text-white/60 text-xs font-medium">2x</span>
                                            </div>
                                        </div>
                                        {/* Instructions */}
                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <p className="text-white/80 text-xs bg-black/50 inline-block px-3 py-1.5 rounded-full">
                                                Centra tu plato en el recuadro
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <img
                                            src={capturedImage}
                                            alt="Captured food"
                                            className="w-full h-full object-cover"
                                        />
                                        {isAnalyzing && (
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                                                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                                                <p className="text-white font-medium">Analizando con IA...</p>
                                                <p className="text-white/60 text-sm">Detectando comida y macros</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Camera controls */}
                            <div className="shrink-0 p-4 bg-background border-t border-border" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                                {!capturedImage ? (
                                    <button
                                        onClick={capturePhoto}
                                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                                    >
                                        <Camera className="w-5 h-5" />
                                        Tomar Foto
                                    </button>
                                ) : !isAnalyzing && (
                                    <button
                                        onClick={retakePhoto}
                                        className="w-full py-3 border border-border rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-accent transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Tomar otra foto
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* EDIT SCANNED FOOD VIEW */}
                    {viewMode === 'edit' && scannedFood && (
                        <div className="flex flex-col h-full">
                            {/* Image preview */}
                            {scannedFood.imagePreview && (
                                <div className="h-40 bg-muted overflow-hidden">
                                    <img
                                        src={scannedFood.imagePreview}
                                        alt="Scanned food"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Editable form */}
                            <div className="p-4 space-y-4">
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <p className="text-sm text-green-500">
                                        ¡Comida detectada! Puedes editar los valores antes de agregar.
                                    </p>
                                </div>

                                {/* Name input */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Nombre del plato</label>
                                    <input
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Macros grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-orange-500 flex items-center gap-1">
                                            <Flame className="w-3 h-3" /> Calorías
                                        </label>
                                        <input
                                            type="number"
                                            value={editedCalories}
                                            onChange={(e) => setEditedCalories(parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-blue-500">Proteína (g)</label>
                                        <input
                                            type="number"
                                            value={editedProtein}
                                            onChange={(e) => setEditedProtein(parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-amber-500">Carbohidratos (g)</label>
                                        <input
                                            type="number"
                                            value={editedCarbs}
                                            onChange={(e) => setEditedCarbs(parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-rose-500">Grasas (g)</label>
                                        <input
                                            type="number"
                                            value={editedFats}
                                            onChange={(e) => setEditedFats(parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        />
                                    </div>
                                </div>

                                {/* Meal type indicator */}
                                <div className="text-center text-sm text-muted-foreground">
                                    Se agregará a: <span className="font-medium text-foreground">{getMealLabel(mealType || getMealTypeByTime())}</span>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="mt-auto p-4 border-t border-border flex gap-2">
                                <button
                                    onClick={retakePhoto}
                                    className="flex-1 py-3 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
                                >
                                    <Camera className="w-4 h-4" />
                                    Escanear otra
                                </button>
                                <button
                                    onClick={handleAddScannedFood}
                                    disabled={addingId === "scanned" || !editedName}
                                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {addingId === "scanned" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Agregar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* LIST VIEW */}
                    {viewMode === 'list' && (
                        <>
                            {/* AI Scan Button - Hero Section */}
                            <div className="p-4 border-b border-border bg-gradient-to-b from-indigo-500/5 to-transparent">
                                <button
                                    onClick={startCamera}
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
                                                    {isScanning ? "Abriendo cámara..." : "Generando..."}
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
                                    onClick={() => handleAIGenerate()}
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
                    )}

                    {/* RECIPE DETAIL VIEW */}
                    {viewMode === 'detail' && selectedRecipe && (
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

                            {/* AI Suggestion buttons - only show for AI generated recipes */}
                            {isAISuggestion && (
                                <div className="p-4 border-t border-border flex gap-2 shrink-0">
                                    <button
                                        onClick={handleSimpler}
                                        disabled={isGeneratingAI}
                                        className="flex-1 py-2.5 flex items-center justify-center gap-2 border border-amber-500/50 bg-amber-500/10 text-amber-500 rounded-xl text-sm font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                    >
                                        {isGeneratingAI ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Clock className="w-4 h-4" />
                                                Algo más simple
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleRegenerate}
                                        disabled={isGeneratingAI}
                                        className="flex-1 py-2.5 flex items-center justify-center gap-2 border border-primary/50 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                                    >
                                        {isGeneratingAI ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4" />
                                                Otra sugerencia
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

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
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Helper functions to generate recipe details (abbreviated for file size)
function generateIngredients(mealName: string): string[] {
    const name = mealName.toLowerCase()

    if (name.includes("ensalada") && name.includes("pollo")) {
        return ["200g pechuga de pollo", "2 tazas de lechuga mixta", "1 manzana verde en cubos", "1/4 taza de nueces", "2 cdas de queso feta", "Vinagreta de miel y mostaza"]
    }
    if (name.includes("ensalada") && name.includes("atún")) {
        return ["1 lata de atún en agua", "2 tazas de lechuga", "1/2 pepino", "Cherry tomates", "1/4 cebolla morada", "Aceite de oliva y limón"]
    }
    if (name.includes("ensalada")) {
        return ["3 tazas de hojas verdes mixtas", "1/2 taza de tomate cherry", "1/4 pepino en rodajas", "1/4 taza de zanahoria rallada", "2 cdas aceite de oliva", "1 cda vinagre balsámico", "Sal y pimienta"]
    }
    if (name.includes("pollo") && name.includes("arroz")) {
        return ["200g pechuga de pollo", "1 taza de arroz", "1/2 cebolla", "2 dientes de ajo", "1 pimiento", "Caldo de pollo", "Especias al gusto"]
    }
    if (name.includes("pollo")) {
        return ["200g pechuga de pollo", "1 cda aceite de oliva", "1/2 limón", "Ajo en polvo", "Hierbas provenzales", "Sal y pimienta", "Verduras al vapor (opcional)"]
    }
    if (name.includes("carne") || name.includes("res") || name.includes("bistec")) {
        return ["200g carne magra", "1 cda aceite de oliva", "2 dientes de ajo", "Romero fresco", "Sal gruesa y pimienta", "1 cda mantequilla (opcional)"]
    }
    if (name.includes("salmón") || name.includes("salmon")) {
        return ["180g filete de salmón", "1 cda aceite de oliva", "Jugo de limón", "Eneldo fresco", "Sal y pimienta", "Espárragos o brócoli"]
    }
    if (name.includes("pasta")) {
        return ["100g pasta integral", "2 cdas aceite de oliva", "2 dientes de ajo", "Tomates cherry", "Albahaca fresca", "Queso parmesano", "Sal y pimienta"]
    }
    if (name.includes("avena")) {
        return ["1/2 taza de avena", "1 taza de leche", "1 plátano maduro", "1 cda de miel", "Canela al gusto", "Mantequilla de maní (opcional)"]
    }
    if (name.includes("batido") || name.includes("smoothie") || name.includes("proteína")) {
        return ["1 scoop proteína de suero", "1 taza de leche o agua", "1 plátano", "1/2 taza de avena", "Hielo al gusto", "1 cda mantequilla de maní"]
    }
    if (name.includes("huevo")) {
        return ["2-3 huevos", "1 cda aceite o mantequilla", "Sal y pimienta", "Pan integral", "Verduras opcionales"]
    }
    if (name.includes("sandwich") || name.includes("sándwich")) {
        return ["2 rebanadas de pan integral", "Proteína (jamón/pavo/atún)", "Lechuga y tomate", "1/4 aguacate", "Mostaza o mayonesa ligera", "Queso bajo en grasa"]
    }

    return ["Proteína principal según receta", "Vegetales frescos al gusto", "1-2 cdas aceite de oliva", "Condimentos y especias", "Sal y pimienta al gusto"]
}

function generateInstructions(mealName: string): string[] {
    const name = mealName.toLowerCase()

    if (name.includes("ensalada") && name.includes("pollo")) {
        return [
            "Sazona el pollo con sal, pimienta y hierbas. Cocina a la plancha 6-7 min por lado",
            "Deja reposar el pollo 3 minutos y córtalo en tiras",
            "Mezcla la lechuga, manzana en cubos y nueces",
            "Prepara la vinagreta con miel, mostaza, aceite y vinagre",
            "Agrega el pollo, espolvorea queso feta y rocía la vinagreta"
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
    if (name.includes("pollo")) {
        return [
            "Sazona el pollo con aceite, limón, ajo y especias",
            "Calienta una sartén a fuego medio con aceite",
            "Cocina el pollo 5-7 min por lado hasta que esté dorado",
            "Verifica que esté cocido por dentro (sin rosado)",
            "Sirve con verduras al vapor o ensalada"
        ]
    }
    if (name.includes("carne") || name.includes("res") || name.includes("bistec")) {
        return [
            "Saca la carne del refrigerador 20 min antes",
            "Sazona con sal gruesa y pimienta de ambos lados",
            "Calienta la sartén a fuego alto con aceite",
            "Sella 3-4 min por lado sin moverla",
            "Deja reposar 5 minutos antes de cortar"
        ]
    }
    if (name.includes("pasta")) {
        return [
            "Hierve agua con sal y cocina la pasta según el paquete",
            "Sofríe ajo picado en aceite de oliva a fuego bajo",
            "Añade los tomates cherry cortados por la mitad",
            "Escurre la pasta reservando agua de cocción",
            "Mezcla todo, corona con albahaca y parmesano"
        ]
    }
    if (name.includes("avena")) {
        return [
            "Calienta la leche en una olla a fuego medio",
            "Agrega la avena y revuelve 3-4 minutos",
            "Cuando espese, retira del fuego",
            "Agrega el plátano en rodajas",
            "Añade miel, canela y mantequilla de maní"
        ]
    }
    if (name.includes("batido") || name.includes("proteína")) {
        return [
            "Agrega la leche y el plátano a la licuadora",
            "Añade la proteína y la avena",
            "Licúa por 30-45 segundos",
            "Agrega hielo y mantequilla de maní",
            "Licúa 15 segundos más y sirve"
        ]
    }
    if (name.includes("huevo")) {
        return [
            "Calienta mantequilla en una sartén a fuego medio",
            "Casca los huevos cuidadosamente",
            "Sazona con sal y pimienta",
            "Cocina al punto deseado",
            "Sirve con pan tostado"
        ]
    }

    return [
        "Reúne y prepara todos los ingredientes",
        "Sazona la proteína con sal y especias",
        "Cocina en sartén caliente hasta el punto deseado",
        "Prepara los acompañamientos",
        "Sirve caliente y disfruta"
    ]
}
