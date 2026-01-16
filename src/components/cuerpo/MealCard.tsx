"use client"

import { useState } from "react"
import { Plus, Wand2, Check, MoreHorizontal, Trash2, RefreshCw, Pencil, Loader2, ChevronDown, ChevronUp } from "lucide-react"
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

const getMealEmoji = (type: string) => {
    switch (type) {
        case "BREAKFAST":
        case MealType.BREAKFAST: return "🌅"
        case "LUNCH":
        case MealType.LUNCH: return "☀️"
        case "DINNER":
        case MealType.DINNER: return "🌙"
        case "SNACK":
        case MealType.SNACK: return "🍎"
        default: return "🍽️"
    }
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
    const [isExpanded, setIsExpanded] = useState(items.length > 0)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [repeatingId, setRepeatingId] = useState<string | null>(null)

    const label = getMealLabel(type as string)
    const emoji = getMealEmoji(type as string)

    const handleDelete = async (entryId: string) => {
        if (!onDeleteEntry) return
        setDeletingId(entryId)
        try {
            await onDeleteEntry(entryId)
            toast({ title: "Eliminado" })
        } finally {
            setDeletingId(null)
        }
    }

    const handleRepeat = async (entry: any) => {
        if (!onRepeatEntry) return
        setRepeatingId(entry.id)
        try {
            await onRepeatEntry(entry)
            toast({ title: "Repetido para mañana" })
        } finally {
            setRepeatingId(null)
        }
    }

    return (
        <div className={cn(
            "bg-card border border-border rounded-xl overflow-hidden transition-all",
            className
        )}>
            {/* Compact Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-lg">{emoji}</span>
                    <div className="text-left">
                        <h3 className="font-semibold text-sm">{label}</h3>
                        {items.length > 0 ? (
                            <p className="text-xs text-muted-foreground">
                                {calories} kcal • {items.length} {items.length === 1 ? "alimento" : "alimentos"}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">Sin registrar</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {calories > 0 && (
                        <span className="text-sm font-bold text-primary">{calories}</span>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="border-t border-border">
                    {/* Food Items List */}
                    {items.length > 0 && (
                        <div className="divide-y divide-border">
                            {items.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-accent/20 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.calories} kcal
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
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
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem onClick={() => handleRepeat(item)}>
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Repetir mañana
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(item.id)}
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

                    {/* Action Buttons */}
                    <div className="flex gap-2 p-3 bg-muted/30">
                        <button
                            onClick={onAddFood}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-background border border-border hover:border-primary/50 hover:bg-accent/50 text-sm font-medium rounded-lg transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar
                        </button>
                        {onRecommend && (
                            <button
                                onClick={onRecommend}
                                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 text-indigo-500 text-sm font-medium rounded-lg transition-all"
                            >
                                <Wand2 className="w-4 h-4" />
                                IA
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
