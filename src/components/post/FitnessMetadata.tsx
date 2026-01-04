import { Dumbbell, Repeat, Weight, Timer, Gauge } from "lucide-react"
import type { PostMetadata } from "@/types"

interface FitnessMetadataProps {
    metadata: PostMetadata
}

export function FitnessMetadata({ metadata }: FitnessMetadataProps) {
    const items = []

    if (metadata.exercise) {
        items.push({
            icon: Dumbbell,
            label: metadata.exercise,
        })
    }

    if (metadata.sets && metadata.reps) {
        items.push({
            icon: Repeat,
            label: `${metadata.sets}x${metadata.reps}`,
        })
    }

    if (metadata.weight) {
        items.push({
            icon: Weight,
            label: `${metadata.weight} ${metadata.unit || "kg"}`,
        })
    }

    if (metadata.duration) {
        const mins = metadata.duration
        items.push({
            icon: Timer,
            label: mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`,
        })
    }

    if (metadata.rpe) {
        items.push({
            icon: Gauge,
            label: `RPE ${metadata.rpe}`,
        })
    }

    if (items.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {items.map((item, index) => {
                const Icon = item.icon
                return (
                    <div
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm"
                    >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                    </div>
                )
            })}
        </div>
    )
}
