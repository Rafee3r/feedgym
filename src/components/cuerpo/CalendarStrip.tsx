"use client"

import { useState } from "react"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface CalendarStripProps {
    selectedDate: Date
    onSelectDate: (date: Date) => void
    className?: string
}

export function CalendarStrip({ selectedDate, onSelectDate, className }: CalendarStripProps) {
    // Current week view starting from Monday
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))

    return (
        <div className={cn("flex justify-between items-center gap-1 bg-card border-b border-border p-2", className)}>
            {days.map((day) => {
                const isSelected = isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())

                return (
                    <button
                        key={day.toString()}
                        onClick={() => onSelectDate(day)}
                        className={cn(
                            "flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-all",
                            isSelected
                                ? "bg-primary text-primary-foreground shadow-sm scale-105 font-bold"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                            isToday && !isSelected && "bg-accent/50 text-accent-foreground border border-primary/20"
                        )}
                    >
                        <span className="text-[10px] uppercase tracking-wider opacity-80">
                            {format(day, "EEE", { locale: es }).slice(0, 3)}
                        </span>
                        <span className="text-lg">
                            {format(day, "d")}
                        </span>

                        {/* Dot indicator for logged data (placeholder logic for now) */}
                        <div className={cn("w-1 h-1 rounded-full mt-1",
                            isToday ? "bg-primary" : "bg-transparent"
                        )} />
                    </button>
                )
            })}
        </div>
    )
}
