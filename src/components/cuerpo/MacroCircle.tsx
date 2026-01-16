"use client"

import { cn } from "@/lib/utils"

interface MacroCircleProps {
    currentCalories: number
    targetCalories: number
    className?: string
}

export function MacroCircle({
    currentCalories,
    targetCalories,
    className
}: MacroCircleProps) {
    const percentage = Math.min(100, Math.max(0, (currentCalories / targetCalories) * 100))
    const remaining = Math.max(0, targetCalories - currentCalories)

    // SVG Circle calculations
    const radius = 80
    const strokeWidth = 12
    const normalizedRadius = radius - strokeWidth * 2
    const circumference = normalizedRadius * 2 * Math.PI
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
        <div className={cn("relative flex flex-col items-center justify-center", className)}>
            <svg
                height={radius * 2}
                width={radius * 2}
                className="rotate-[-90deg]"
            >
                {/* Background Circle */}
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset: 0 }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="text-muted/20"
                />
                {/* Progress Circle */}
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className={cn(
                        "transition-all duration-1000 ease-out",
                        percentage > 100 ? "text-red-500" : "text-primary"
                    )}
                />
            </svg>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold tracking-tight">
                    {currentCalories}
                </span>
                <span className="text-xs text-muted-foreground uppercase font-medium mt-1">
                    consumidas
                </span>
                <div className="mt-2 text-sm font-medium text-muted-foreground">
                    Faltan {remaining}
                </div>
            </div>
        </div>
    )
}
