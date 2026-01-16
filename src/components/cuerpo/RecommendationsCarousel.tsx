
"use client"

import { Plus, ArrowRight, Clock, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface Recommendation {
    id: string
    name: string
    calories: number
    timeMins: number
    image: string
    tags: string[]
}

const MOCK_RECOMMENDATIONS: Recommendation[] = [
    {
        id: "1",
        name: "Omelette de Espinaca y Tomate",
        calories: 280,
        timeMins: 10,
        image: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        tags: ["Proteína", "Keto"]
    },
    {
        id: "2",
        name: "Avena con Frutos Rojos",
        calories: 320,
        timeMins: 5,
        image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        tags: ["Energía", "Fibra"]
    },
    {
        id: "3",
        name: "Tostadas de Aguacate y Huevo",
        calories: 350,
        timeMins: 8,
        image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        tags: ["Grasas G.", "Veggie"]
    }
]

interface RecommendationsCarouselProps {
    title?: string
    onSelect?: (item: Recommendation) => void
    className?: string
}

export function RecommendationsCarousel({
    title = "Desayunos Para Ti",
    onSelect,
    className
}: RecommendationsCarouselProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-lg">{title}</h3>
                <button className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                    Ver todos <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                {MOCK_RECOMMENDATIONS.map((item) => (
                    <div
                        key={item.id}
                        className="snap-start shrink-0 w-64 bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer"
                        onClick={() => onSelect?.(item)}
                    >
                        {/* Image Header */}
                        <div className="h-32 w-full relative overflow-hidden">
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.timeMins} min
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-3">
                            <h4 className="font-semibold text-sm line-clamp-1 mb-1">{item.name}</h4>

                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                                    <Flame className="w-3 h-3 fill-current" />
                                    {item.calories} kcal
                                </div>
                                <span className="text-muted-foreground/30">•</span>
                                <div className="flex gap-1">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-bold py-2 rounded-lg transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                                Agregar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
