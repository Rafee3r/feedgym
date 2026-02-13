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
    compact?: boolean
}

export function ConsistencyCard({
    activityData,
    isLoading,
    onOpenSettings,
    className,
    userName,
    compact = false
}: ConsistencyCardProps) {

    // ── Compact mode: Instagram stories-style circles ──
    if (compact) {
        return (
            <div className={`shrink-0 ${className ?? ""}`}>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Constancia</span>
                        {activityData && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full ml-1">
                                {activityData.stats.daysPosted}/{activityData.stats.scheduledTarget || 0}
                            </span>
                        )}
                    </div>
                    {onOpenSettings && (
                        <Button
                            onClick={onOpenSettings}
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                        >
                            <Settings className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-3">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                ) : activityData ? (
                    <div className="flex items-start justify-between w-full">
                        {activityData.weekDays.map((day, index) => {
                            const dayLabels = ["L", "M", "X", "J", "V", "S", "D"]
                            const dayLabel = dayLabels[index]
                            const isScheduled = activityData.trainingDays.includes(day.dayName)
                            const completed = isScheduled && day.hasPost
                            const isActiveToday = day.isToday && isScheduled && !day.hasPost
                            const missed = isScheduled && day.isPast && !day.hasPost && !day.isToday

                            // Ring: only visible for scheduled days
                            let ringClass = "border-2 border-transparent" // unscheduled — invisible ring
                            if (completed) ringClass = "border-2 border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.25)]"
                            else if (isActiveToday) ringClass = "border-2 border-primary animate-pulse"
                            else if (missed) ringClass = "border-2 border-muted-foreground/25"
                            else if (isScheduled) ringClass = "border-2 border-muted-foreground/15"

                            // Inner fill
                            let innerContent: React.ReactNode = null
                            if (completed) {
                                innerContent = <span className="text-green-500 text-xs font-bold">✓</span>
                            } else if (isActiveToday) {
                                innerContent = <div className="w-2.5 h-2.5 rounded-full bg-primary/80" />
                            } else if (missed) {
                                innerContent = <span className="text-muted-foreground/40 text-[9px]">✕</span>
                            }

                            return (
                                <div key={day.date} className="flex flex-col items-center gap-1.5">
                                    {/* Day label on top */}
                                    <span className={`text-[10px] leading-none ${day.isToday
                                            ? "text-primary font-bold"
                                            : isScheduled
                                                ? "text-muted-foreground font-medium"
                                                : "text-muted-foreground/25 font-medium"
                                        }`}>
                                        {dayLabel}
                                    </span>
                                    {/* Circle */}
                                    <div className={`w-9 h-9 rounded-full ${ringClass} flex items-center justify-center transition-all duration-300 ${!isScheduled ? "opacity-30" : ""
                                        }`}>
                                        <div className={`w-[28px] h-[28px] rounded-full flex items-center justify-center ${completed ? "bg-green-500/10" : "bg-card/50"
                                            }`}>
                                            {innerContent}
                                        </div>
                                    </div>
                                    {/* Today indicator */}
                                    {day.isToday && (
                                        <div className="w-1 h-1 rounded-full bg-primary" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : null}

                {/* Compact missed-today alert */}
                {activityData?.stats.missedToday && (
                    <div className="flex items-center gap-2 mt-3 px-2.5 py-2 bg-yellow-500/5 border border-yellow-500/15 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-500/80 shrink-0" />
                        <p className="text-[11px] text-yellow-500/80 font-medium">
                            ¡No pierdas la racha! Publica hoy.
                        </p>
                    </div>
                )}
            </div>
        )
    }

    // ── Default full-size mode ──
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
                                    const dayLabels = ["L", "M", "X", "J", "V", "S", "D"]
                                    const dayLabel = dayLabels[index]
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
