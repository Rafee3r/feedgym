"use client"

import { Plus } from "lucide-react"
import { MealType } from "@/types"
import { cn } from "@/lib/utils"

interface MealCardProps {
    type: string | MealType
    calories: number
    items?: any[]
    onAddFood: () => void
    className?: string
}

export function MealCard({
    type,
    calories,
    items = [],
    onAddFood,
    className
}: MealCardProps) {

    const getMealLabel = (type: string) => {
        switch (type) {
            case "BREAKFAST": return "Desayuno"
            case "LUNCH": return "Almuerzo"
            case "DINNER": return "Cena"
            case "SNACK": return "Snack"
            default: return type
        }
    }

    return (
        <div className={cn("bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/40 transition-colors", className)}>
            <div className="p-4 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-lg">{getMealLabel(type as string)}</h3>
                    <p className="text-sm text-muted-foreground font-medium">
                        {calories} <span className="text-xs">kcal</span>
                    </p>
                </div>

                <button
                    onClick={onAddFood}
                    className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Food Items List (hidden if empty) */}
            {items.length > 0 && (
                <div className="border-t border-border/50 bg-muted/20 p-3 space-y-2">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="text-foreground/90">{item.name}</span>
                            <span className="text-muted-foreground">{item.calories}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
