
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Check, ShoppingCart, Beef, Carrot, Milk, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ShoppingListModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ShoppingListModal({ isOpen, onClose }: ShoppingListModalProps) {
    const [items, setItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [newItemName, setNewItemName] = useState("")
    const [newItemQuantity, setNewItemQuantity] = useState("")

    // Load items when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchList()
        }
    }, [isOpen])

    const fetchList = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/nutrition/shopping-list")
            if (res.ok) {
                const data = await res.json()
                setItems(data.items || [])
            }
        } catch (error) {
            console.error("Failed to fetch shopping list")
        } finally {
            setIsLoading(false)
        }
    }

    const toggleItem = async (id: string, currentChecked: boolean) => {
        // Optimistic update
        setItems(items.map(item =>
            item.id === id ? { ...item, checked: !currentChecked } : item
        ))

        try {
            await fetch("/api/nutrition/shopping-list", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, checked: !currentChecked })
            })
        } catch (error) {
            // Revert on error
            setItems(items.map(item =>
                item.id === id ? { ...item, checked: currentChecked } : item
            ))
        }
    }

    const addItem = async () => {
        if (!newItemName.trim()) return

        const tempId = "temp-" + Date.now()
        const tempItem = {
            id: tempId,
            name: newItemName,
            quantity: newItemQuantity || "1 un.",
            category: "Otros",
            checked: false
        }

        // Optimistic
        setItems([tempItem, ...items])
        setNewItemName("")
        setNewItemQuantity("")

        try {
            const res = await fetch("/api/nutrition/shopping-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: tempItem.name,
                    quantity: tempItem.quantity,
                    category: "Otros" // We could add category selection later
                })
            })

            if (res.ok) {
                const savedItem = await res.json()
                setItems(prev => prev.map(i => i.id === tempId ? savedItem : i))
            }
        } catch (error) {
            setItems(prev => prev.filter(i => i.id !== tempId))
        }
    }

    const categories = Array.from(new Set(items.map(i => i.category || "Otros")))

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
                        Tus items para el súper.
                    </DialogDescription>
                </DialogHeader>

                {/* Add Item Input */}
                <div className="p-4 border-b bg-muted/20 flex gap-2">
                    <input
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
                        placeholder="Agregar item (ej. Arroz)"
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addItem()}
                    />
                    <input
                        className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-sm"
                        placeholder="Cant."
                        value={newItemQuantity}
                        onChange={e => setNewItemQuantity(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addItem()}
                    />
                    <button
                        onClick={addItem}
                        disabled={!newItemName.trim()}
                        className="bg-primary text-primary-foreground p-2 rounded-lg disabled:opacity-50"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading && items.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">Cargando lista...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">Tu lista está vacía.</div>
                    ) : (
                        categories.map(cat => (
                            <div key={cat} className="space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                    {getCategoryIcon(cat)}
                                    {cat}
                                </h4>
                                <div className="space-y-2">
                                    {items.filter(i => (i.category || "Otros") === cat).map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItem(item.id, item.checked)}
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
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
