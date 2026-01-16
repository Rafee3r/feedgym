"use client"

import { useState, useEffect } from "react"
import { Search, Camera, ChefHat, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MealType } from "@/types"

interface AddFoodModalProps {
    isOpen: boolean
    onClose: () => void
    mealType: string
    onAddFood: (foodItem: any) => void
}

export function AddFoodModal({ isOpen, onClose, mealType, onAddFood }: AddFoodModalProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("search")

    // Kitchen state
    const [kitchenItems, setKitchenItems] = useState<any[]>([])
    const [newKitchenItem, setNewKitchenItem] = useState("")

    // Fetch Kitchen Items
    useEffect(() => {
        if (activeTab === "kitchen") {
            fetch("/api/nutrition/kitchen")
                .then(res => res.json())
                .then(setKitchenItems)
                .catch(console.error)
        }
    }, [activeTab])

    const handleAddKitchenItem = async () => {
        if (!newKitchenItem.trim()) return
        try {
            const res = await fetch("/api/nutrition/kitchen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create", name: newKitchenItem })
            })
            if (res.ok) {
                const item = await res.json()
                setKitchenItems([item, ...kitchenItems])
                setNewKitchenItem("")
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteKitchenItem = async (id: string) => {
        try {
            await fetch("/api/nutrition/kitchen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", id })
            })
            setKitchenItems(kitchenItems.filter(i => i.id !== id))
        } catch (error) {
            console.error(error)
        }
    }

    const useKitchenItem = (name: string) => {
        setSearchTerm(name)
        setActiveTab("search")
    }

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length > 1) {
                setIsLoading(true)
                try {
                    const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(searchTerm)}`)
                    const data = await res.json()
                    setSearchResults(data)
                } catch (error) {
                    console.error("Search failed", error)
                } finally {
                    setIsLoading(false)
                }
            } else {
                setSearchResults([])
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm])

    const handleAdd = (item: any) => {
        onAddFood({ ...item, mealType })
        onClose()
    }

    const getMealLabel = (type: string) => {
        switch (type) {
            case "BREAKFAST": return "Desayuno"
            case "LUNCH": return "Almuerzo"
            case "DINNER": return "Cena"
            case "SNACK": return "Snack"
            default: return type
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0 gap-0 bg-background">
                <DialogHeader className="p-4 border-b border-border">
                    <DialogTitle>Agregar a {getMealLabel(mealType)}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border bg-muted/40 p-0 h-12">
                        <TabsTrigger value="search" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full">
                            <Search className="w-4 h-4 mr-2" />
                            Buscar
                        </TabsTrigger>
                        <TabsTrigger value="camera" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full">
                            <Camera className="w-4 h-4 mr-2" />
                            Cámara IA
                        </TabsTrigger>
                        <TabsTrigger value="kitchen" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full">
                            <ChefHat className="w-4 h-4 mr-2" />
                            Mi Cocina
                        </TabsTrigger>
                    </TabsList>

                    {/* SEARCH TAB */}
                    <TabsContent value="search" className="flex-1 flex flex-col p-0 m-0 overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar alimento (ej. Manzana)..."
                                    className="pl-9 bg-muted/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {isLoading && (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    Buscando...
                                </div>
                            )}

                            {!isLoading && searchResults.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.calories} kcal • {item.unit}
                                        </p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => handleAdd(item)}>
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                            ))}

                            {!isLoading && searchResults.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    {searchTerm.length > 1 ? "No se encontraron resultados" : "Escribe para buscar"}
                                    <br />
                                    <Button variant="link" className="mt-2 text-primary" onClick={() => setActiveTab("kitchen")}>
                                        Ir a Mi Cocina
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* CAMERA TAB */}
                    <TabsContent value="camera" className="flex-1 p-4 m-0 flex flex-col items-center justify-center text-center overflow-y-auto">
                        {!isLoading && searchResults.length === 0 ? (
                            <>
                                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                                    <Camera className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg">Escanear Comida</h3>
                                <p className="text-sm text-muted-foreground max-w-[200px] mb-6">
                                    Sube una foto y deja que la IA identifique los macros por ti.
                                </p>
                                <label>
                                    <Button asChild>
                                        <span>
                                            <Camera className="w-4 h-4 mr-2" />
                                            Subir Foto
                                        </span>
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                setIsLoading(true)
                                                try {
                                                    const reader = new FileReader()
                                                    reader.readAsDataURL(file)
                                                    reader.onload = async () => {
                                                        const base64 = reader.result
                                                        const res = await fetch("/api/ai/food-vision", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ image: base64 })
                                                        })
                                                        const data = await res.json()
                                                        // Reuse newKitchenItem state for temporary holding the result? 
                                                        // No, better use a separate state or reuse searchResults logic
                                                        // Let's reuse searchResults for simplicity but show differently
                                                        setSearchResults([data])
                                                        // Hacky reuse of state, ideally separate
                                                    }
                                                } catch (err) {
                                                    console.error(err)
                                                } finally {
                                                    setIsLoading(false)
                                                }
                                            }
                                        }}
                                    />
                                </label>
                            </>
                        ) : (
                            <div className="w-full">
                                {isLoading && (
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="text-sm text-muted-foreground">Analizando tu comida...</p>
                                    </div>
                                )}

                                {!isLoading && searchResults.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="bg-muted/30 p-4 rounded-xl border border-primary/20">
                                            <h3 className="font-bold text-xl mb-1">{searchResults[0].name}</h3>
                                            <div className="flex justify-center gap-4 text-sm mb-4">
                                                <span>🔥 {searchResults[0].calories} kcal</span>
                                                <span>🥩 {searchResults[0].protein}g</span>
                                                <span>🍞 {searchResults[0].carbs}g</span>
                                            </div>
                                            <Button className="w-full" onClick={() => handleAdd(searchResults[0])}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Agregar al Diario
                                            </Button>
                                        </div>
                                        <Button variant="ghost" onClick={() => setSearchResults([])}>
                                            Intentar de nuevo
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* KITCHEN TAB */}
                    <TabsContent value="kitchen" className="flex-1 flex flex-col p-0 m-0 overflow-hidden">
                        <div className="p-4 border-b border-border flex gap-2">
                            <Input
                                placeholder="Agregar ingrediente..."
                                value={newKitchenItem}
                                onChange={(e) => setNewKitchenItem(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddKitchenItem()}
                            />
                            <Button onClick={handleAddKitchenItem}>Agregar</Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {kitchenItems.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Tu cocina está vacía. Agrega ingredientes frecuentes.
                                </div>
                            )}
                            {kitchenItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border group">
                                    <div className="flex-1 cursor-pointer" onClick={() => useKitchenItem(item.name)}>
                                        <p className="font-medium">{item.name}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteKitchenItem(item.id)}
                                    >
                                        Borrar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
