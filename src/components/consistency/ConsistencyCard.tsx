"use client"

import { Flame, Settings, AlertTriangle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface ActivityData {
    weekDays: {
        date: string
        hasPost: boolean
        isToday: boolean
        isPast: boolean
        dayName: string // Day name from API (Monday, Tuesday, etc.)
    }[]
    trainingDays: string[]
    stats: {
        daysPosted: number
        totalDoays: number
        scheduledTarget: number
        missedToday: boolean
    }
}

interface ConsistencyCardProps {
    activityData: ActivityData | null
    isLoading: boolean
    onOpenSettings?: () => void
    className?: string
    userName?: string
}

export function ConsistencyCard({
    activityData,
    isLoading,
    onOpenSettings,
    className,
    userName
}: ConsistencyCardProps) {
    return (
        <Card className={`bg-transparent border-0 shadow-none shrink-0 ${className}`}>
            <CardHeader className="pb-2 px-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Flame className="w-5 h-5 text-primary" />
                        {userName ? `Constancia de ${userName}` : "Constancia"}
                    </CardTitle>
                    {onOpenSettings && (
                        <Button
                            onClick={onOpenSettings}
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-0 pt-0">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                ) : activityData ? (
                    <div className="space-y-4">
                        <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-medium text-muted-foreground">Esta semana</span>
                                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    {activityData.stats.daysPosted}/{activityData.stats.scheduledTarget || 0} días
                                </span>
                            </div>

                            <div className="flex justify-between px-1">
                                {activityData.weekDays.map((day, index) => {
                                    // Day labels in Monday-first order: L M X J V S D
                                    const dayLabels = ["L", "M", "X", "J", "V", "S", "D"]
                                    const dayLabel = dayLabels[index] // Use index since data comes Monday-first
                                    // Use dayName from API directly (already correctly calculated on server)
                                    const isScheduled = activityData.trainingDays.includes(day.dayName)

                                    return (
                                        <div key={day.date} className="flex flex-col items-center gap-2">
                                            <span className={`text-[10px] font-medium ${isScheduled ? "text-foreground" : "text-muted-foreground/30"}`}>
                                                {dayLabel}
                                            </span>
                                            <div
                                                className={`w-3 h-3 rounded-full transition-all ${(isScheduled && day.hasPost)
                                                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                                                    : (day.isToday && isScheduled)
                                                        ? "bg-transparent border border-muted-foreground/50 animate-pulse"
                                                        : isScheduled
                                                            ? "bg-secondary"
                                                            : "bg-muted/10"
                                                    }`}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {activityData.stats.missedToday && (
                            <div className="flex gap-3 items-start bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-yellow-500 leading-none">
                                        No has publicado tu progreso
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Hoy es día de entrenamiento. ¡No pierdas la racha!
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    )
}
