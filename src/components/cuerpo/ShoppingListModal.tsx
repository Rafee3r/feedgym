
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Check, ShoppingCart, Beef, Carrot, Milk, AlertCircle } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface ShoppingListModalProps {
    isOpen: boolean
    onClose: () => void
}

const INITIAL_ITEMS = [
    { id: "1", name: "Pollo", quantity: "500g", category: "Proteínas", checked: false },
    { id: "2", name: "Huevos", quantity: "12 un.", category: "Proteínas", checked: true },
    { id: "3", name: "Espinaca", quantity: "1 atado", category: "Verduras", checked: false },
    { id: "4", name: "Tomates", quantity: "4 un.", category: "Verduras", checked: false },
    { id: "5", name: "Leche", quantity: "1 L", category: "Lácteos", checked: false },
    { id: "6", name: "Avena", quantity: "1 kg", category: "Granos", checked: true },
]

export function ShoppingListModal({ isOpen, onClose }: ShoppingListModalProps) {
    const [items, setItems] = useState(INITIAL_ITEMS)

    const toggleItem = (id: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ))
    }

    const categories = Array.from(new Set(items.map(i => i.category)))

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case "Proteínas": return <Beef className="w-4 h-4 text-red-500" />
            case "Verduras": return <Carrot className="w-4 h-4 text-green-500" />
            case "Lácteos": return <Milk className="w-4 h-4 text-blue-500" />
            default: return <ShoppingCart className="w-4 h-4 text-muted-foreground" />
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        Lista de Compras
                    </DialogTitle>
                    <DialogDescription>
                        Generada automáticamente para tu plan semanal.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {categories.map(cat => (
                        <div key={cat} className="space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                {getCategoryIcon(cat)}
                                {cat}
                            </h4>
                            <div className="space-y-2">
                                {items.filter(i => i.category === cat).map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleItem(item.id)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border border-transparent transition-all cursor-pointer",
                                            item.checked ? "bg-muted/50 text-muted-foreground line-through decoration-muted-foreground/50" : "bg-card border-border hover:border-primary/30 shadow-sm"
                                        )}
                                    >
                                        <span className="font-medium text-sm">{item.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono bg-accent/50 px-2 py-1 rounded">
                                                {item.quantity}
                                            </span>
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                                item.checked ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30"
                                            )}>
                                                {item.checked && <Check className="w-3 h-3" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="bg-blue-500/10 text-blue-600 p-4 rounded-xl text-xs flex gap-3 items-start">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>Esta lista se basa en los ingredientes de tus comidas planificadas para los próximos 3 días. Ajusta según lo que ya tengas en "Mi Cocina".</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
