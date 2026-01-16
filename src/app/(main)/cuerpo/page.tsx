"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calculator, Flame } from "lucide-react"
import { MacroCircle } from "@/components/cuerpo/MacroCircle"

import { CalendarStrip } from "@/components/cuerpo/CalendarStrip"
import { MealCard } from "@/components/cuerpo/MealCard"
import { MealType } from "@/types"

export default function CuerpoPage() {
    const { data: session } = useSession()
    const [selectedDate, setSelectedDate] = useState(new Date())

    const handleAddFood = (type: string) => {
        // TODO: Open food search modal
        console.log("Add food to", type)
    }

    // Mock data for now until API is ready
    const dailyStats = {
        calories: { current: 1250, target: 2400 },
        protein: { current: 85, target: 160 },
        carbs: { current: 120, target: 280 },
        fats: { current: 40, target: 70 },
    }

    return (
        <div className="max-w-2xl mx-auto pb-20">
            {/* Date Selector */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                    <h1 className="font-bold text-lg">Diario</h1>
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

            <div className="p-4 space-y-6">
                {/* Hero Card - Macro Circle Placeholder */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">Resumen Diario</h2>
                        <button className="text-sm text-primary flex items-center gap-1">
                            <Calculator className="w-4 h-4" />
                            Ajustar Metas
                        </button>
                    </div>

                    <div className="flex justify-center py-4">
                        <MacroCircle
                            currentCalories={dailyStats.calories.current}
                            targetCalories={dailyStats.calories.target}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Proteína</p>
                            <p className="font-bold text-lg">{dailyStats.protein.current} / {dailyStats.protein.target}g</p>
                            <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(dailyStats.protein.current / dailyStats.protein.target) * 100}%` }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Carbs</p>
                            <p className="font-bold text-lg">{dailyStats.carbs.current} / {dailyStats.carbs.target}g</p>
                            <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(dailyStats.carbs.current / dailyStats.carbs.target) * 100}%` }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Grasas</p>
                            <p className="font-bold text-lg">{dailyStats.fats.current} / {dailyStats.fats.target}g</p>
                            <div className="h-1.5 w-full bg-muted rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${(dailyStats.fats.current / dailyStats.fats.target) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meal Sections */}
                <div className="space-y-4">
                    <MealCard
                        type={MealType.BREAKFAST}
                        calories={450}
                        onAddFood={() => handleAddFood(MealType.BREAKFAST)}
                    />
                    <MealCard
                        type={MealType.LUNCH}
                        calories={600}
                        onAddFood={() => handleAddFood(MealType.LUNCH)}
                    />
                    <MealCard
                        type={MealType.DINNER}
                        calories={0}
                        onAddFood={() => handleAddFood(MealType.DINNER)}
                    />
                    <MealCard
                        type={MealType.SNACK}
                        calories={200}
                        onAddFood={() => handleAddFood(MealType.SNACK)}
                    />
                </div>
            </div>
        </div>
    )
}
