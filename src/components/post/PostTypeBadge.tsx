import { Dumbbell, TrendingUp, Trophy, Utensils, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PostType } from "@/types"

const typeConfig: Record<
    PostType,
    { icon: React.ElementType; label: string; className: string }
> = {
    WORKOUT: {
        icon: Dumbbell,
        label: "Entrenamiento",
        className: "post-type-workout",
    },
    PROGRESS: {
        icon: TrendingUp,
        label: "Progreso",
        className: "post-type-progress",
    },
    PR: {
        icon: Trophy,
        label: "Record Personal",
        className: "post-type-pr",
    },
    MEAL: {
        icon: Utensils,
        label: "Comida",
        className: "post-type-meal",
    },
    NOTE: {
        icon: FileText,
        label: "Nota",
        className: "post-type-note",
    },
}

interface PostTypeBadgeProps {
    type: PostType
}

export function PostTypeBadge({ type }: PostTypeBadgeProps) {
    const config = typeConfig[type]
    const Icon = config.icon

    return (
        <span className={cn("post-type-badge", config.className)}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    )
}
