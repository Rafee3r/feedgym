"use client"

import { useState } from "react"
import { Plus, Wand2, Check, MoreHorizontal, Utensils, Egg, Beef, Carrot, Coffee, Wheat, Milk, Trash2, RefreshCw, Pencil, Loader2 } from "lucide-react"
import { MealType } from "@/types"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"

interface MealCardProps {
    type: string | MealType
    calories: number
    items?: any[]
    onAddFood: () => void
    onRecommend?: () => void
    onDeleteEntry?: (entryId: string) => void
    onRepeatEntry?: (entry: any) => void
    className?: string
}

const getFoodIcon = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes("huevo")) return <Egg className="w-4 h-4 text-yellow-500" />
    if (n.includes("pollo") || n.includes("carne") || n.includes("atún") || n.includes("pescado") || n.includes("salmon")) return <Beef className="w-4 h-4 text-red-500" />
    if (n.includes("arroz") || n.includes("avena") || n.includes("pan") || n.includes("pasta") || n.includes("tallar")) return <Wheat className="w-4 h-4 text-amber-500" />
    if (n.includes("leche") || n.includes("yogur") || n.includes("queso") || n.includes("cottage")) return <Milk className="w-4 h-4 text-blue-400" />
    if (n.includes("café")) return <Coffee className="w-4 h-4 text-amber-800" />
    if (n.includes("manzana") || n.includes("plátano") || n.includes("fruta") || n.includes("ensalada") || n.includes("verdura") || n.includes("espinaca")) return <Carrot className="w-4 h-4 text-green-500" />
    return <Utensils className="w-4 h-4 text-muted-foreground" />
}

export function MealCard({
    type,
    calories,
    items = [],
    onAddFood,
    onRecommend,
    onDeleteEntry,
    onRepeatEntry,
    className
}: MealCardProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [repeatingId, setRepeatingId] = useState<string | null>(null)

    const getMealLabel = (type: string) => {
        switch (type) {
            case "BREAKFAST":
            case MealType.BREAKFAST: return "Desayuno"
            case "LUNCH":
            case MealType.LUNCH: return "Almuerzo"
            case "DINNER":
            case MealType.DINNER: return "Cena"
            case "SNACK":
            case MealType.SNACK: return "Snack"
            default: return type
        }
    }

    const handleDelete = async (entryId: string) => {
        if (!onDeleteEntry) return
        setDeletingId(entryId)
        try {
            await onDeleteEntry(entryId)
            toast({ title: "Eliminado", description: "Comida eliminada del registro" })
        } finally {
            setDeletingId(null)
        }
    }

    const handleRepeat = async (entry: any) => {
        if (!onRepeatEntry) return
        setRepeatingId(entry.id)
        try {
            await onRepeatEntry(entry)
            toast({ title: "¡Repetido!", description: `${entry.name} agregado para mañana` })
        } finally {
            setRepeatingId(null)
        }
    }

    const label = getMealLabel(type as string)

    return (
        <div className={cn("bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md", className)}>
            {/* Header */}
            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-xl">{label}</h3>
                        {items.length > 0 ? (
                            <p className="text-sm text-muted-foreground font-medium mt-1">
                                {calories} kcal <span className="text-xs opacity-70">• {items.length} alimentos</span>
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic mt-1">Sin registrar</p>
                        )}
                    </div>
                    {/* Calories Circle if items exist */}
                    {calories > 0 && (
                        <div className="flex flex-col items-end">
                            <span className="font-bold text-lg text-primary">{calories}</span>
                            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Kcal</span>
                        </div>
                    )}
                </div>

                {/* Main Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onAddFood}
                        className="flex-1 flex items-center justify-center gap-2 bg-accent/50 hover:bg-accent text-foreground font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Registrar Alimento
                    </button>
                    {onRecommend && (
                        <button
                            onClick={onRecommend}
                            className="flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
                        >
                            <Wand2 className="w-4 h-4" />
                            Armar Comida
                        </button>
                    )}
                </div>
            </div>

            {/* Food Items List */}
            {items.length > 0 && (
                <div className="bg-muted/10 px-2 pb-2 space-y-1">
                    {items.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-background/80 transition-colors group">
                            {/* Checkbox-like visual */}
                            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 text-green-600">
                                <Check className="w-3.5 h-3.5" />
                            </div>

                            {/* Icon & Name */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {getFoodIcon(item.name)}
                                    <p className="font-medium text-sm truncate text-foreground/90">{item.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground pl-6">
                                    {item.portion || 1} {item.unit || "porción"} • {item.calories} kcal
                                </p>
                            </div>

                            {/* Actions Menu (three dots) */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all">
                                        {deletingId === item.id || repeatingId === item.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <MoreHorizontal className="w-4 h-4" />
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                        onClick={() => handleRepeat(item)}
                                        disabled={repeatingId === item.id}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Repetir mañana
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            // For now, just show a toast. Edit functionality can be expanded
                                            toast({ title: "Próximamente", description: "Edición de porciones en desarrollo" })
                                        }}
                                    >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Cambiar porción
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deletingId === item.id}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
