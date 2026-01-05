"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Header } from "@/components/layout/Header"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Moon, Sun, Monitor, Eclipse, Type, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEYS = {
    reducedMotion: "feedgym-reduced-motion",
    textSize: "feedgym-text-size",
    zoom: "feedgym-zoom"
}

export default function AppearanceSettingsPage() {
    const { theme, setTheme } = useTheme()

    // Preferences state
    const [reducedMotion, setReducedMotion] = useState(false)
    const [textSize, setTextSize] = useState(100) // 100% base
    const [zoom, setZoom] = useState(100) // 100% base
    const [mounted, setMounted] = useState(false)

    // Load preferences on mount
    useEffect(() => {
        setMounted(true)
        const savedReducedMotion = localStorage.getItem(STORAGE_KEYS.reducedMotion)
        const savedTextSize = localStorage.getItem(STORAGE_KEYS.textSize)
        const savedZoom = localStorage.getItem(STORAGE_KEYS.zoom)

        if (savedReducedMotion) setReducedMotion(savedReducedMotion === "true")
        if (savedTextSize) setTextSize(parseInt(savedTextSize))
        if (savedZoom) setZoom(parseInt(savedZoom))
    }, [])

    // Apply reduced motion
    useEffect(() => {
        if (!mounted) return
        localStorage.setItem(STORAGE_KEYS.reducedMotion, String(reducedMotion))
        if (reducedMotion) {
            document.documentElement.classList.add("reduce-motion")
        } else {
            document.documentElement.classList.remove("reduce-motion")
        }
    }, [reducedMotion, mounted])

    // Apply text size
    useEffect(() => {
        if (!mounted) return
        localStorage.setItem(STORAGE_KEYS.textSize, String(textSize))
        document.documentElement.style.setProperty("--text-scale", `${textSize / 100}`)
    }, [textSize, mounted])

    // Apply zoom
    useEffect(() => {
        if (!mounted) return
        localStorage.setItem(STORAGE_KEYS.zoom, String(zoom))
        document.documentElement.style.setProperty("--zoom-scale", `${zoom / 100}`)
    }, [zoom, mounted])

    const themes = [
        { value: "light", icon: Sun, label: "Claro" },
        { value: "dark", icon: Moon, label: "Oscuro" },
        { value: "pitch-black", icon: Eclipse, label: "Pitch Black", description: "OLED" },
        { value: "system", icon: Monitor, label: "Sistema" },
    ]

    const resetToDefaults = () => {
        setReducedMotion(false)
        setTextSize(100)
        setZoom(100)
    }

    if (!mounted) return null

    return (
        <>
            <Header title="Apariencia" showBack />

            <div className="p-4 space-y-6">
                {/* Theme Selection */}
                <div>
                    <h3 className="font-semibold mb-4">Tema</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {themes.map((t) => {
                            const Icon = t.icon
                            const isActive = theme === t.value
                            return (
                                <button
                                    key={t.value}
                                    onClick={() => setTheme(t.value)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors",
                                        isActive
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:bg-accent/50"
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "w-6 h-6",
                                            isActive ? "text-primary" : "text-muted-foreground"
                                        )}
                                    />
                                    <div className="text-center">
                                        <span
                                            className={cn(
                                                "text-sm font-medium block",
                                                isActive ? "text-primary" : ""
                                            )}
                                        >
                                            {t.label}
                                        </span>
                                        {t.description && (
                                            <span className="text-xs text-muted-foreground">{t.description}</span>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <Separator />

                {/* Preferences */}
                <div className="space-y-6">
                    <h3 className="font-semibold">Preferencias</h3>

                    {/* Reduced Motion */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Animaciones reducidas</Label>
                            <p className="text-sm text-muted-foreground">
                                Reduce las animaciones para mejor rendimiento
                            </p>
                        </div>
                        <Switch
                            checked={reducedMotion}
                            onCheckedChange={setReducedMotion}
                        />
                    </div>

                    {/* Text Size Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Type className="w-4 h-4 text-muted-foreground" />
                                <Label>Tamaño de texto</Label>
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">{textSize}%</span>
                        </div>
                        <Slider
                            value={[textSize]}
                            onValueChange={(v: number[]) => setTextSize(v[0])}
                            min={80}
                            max={140}
                            step={10}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Pequeño</span>
                            <span>Normal</span>
                            <span>Grande</span>
                        </div>
                    </div>

                    {/* Zoom Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ZoomIn className="w-4 h-4 text-muted-foreground" />
                                <Label>Zoom de interfaz</Label>
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">{zoom}%</span>
                        </div>
                        <Slider
                            value={[zoom]}
                            onValueChange={(v: number[]) => setZoom(v[0])}
                            min={80}
                            max={120}
                            step={5}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>80%</span>
                            <span>100%</span>
                            <span>120%</span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Reset */}
                <button
                    onClick={resetToDefaults}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Restablecer valores predeterminados
                </button>
            </div>
        </>
    )
}
