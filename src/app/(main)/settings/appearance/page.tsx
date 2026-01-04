"use client"

import { useTheme } from "next-themes"
import { Header } from "@/components/layout/Header"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AppearanceSettingsPage() {
    const { theme, setTheme } = useTheme()

    const themes = [
        { value: "light", icon: Sun, label: "Claro" },
        { value: "dark", icon: Moon, label: "Oscuro" },
        { value: "system", icon: Monitor, label: "Sistema" },
    ]

    return (
        <>
            <Header title="Apariencia" showBack />

            <div className="p-4 space-y-6">
                {/* Theme Selection */}
                <div>
                    <h3 className="font-semibold mb-4">Tema</h3>
                    <div className="grid grid-cols-3 gap-3">
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
                                    <span
                                        className={cn(
                                            "text-sm font-medium",
                                            isActive ? "text-primary" : ""
                                        )}
                                    >
                                        {t.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <Separator />

                {/* Other Appearance Options */}
                <div className="space-y-4">
                    <h3 className="font-semibold">Preferencias</h3>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Animaciones reducidas</Label>
                            <p className="text-sm text-muted-foreground">
                                Reduce las animaciones para mejor rendimiento
                            </p>
                        </div>
                        <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Fuente más grande</Label>
                            <p className="text-sm text-muted-foreground">
                                Aumenta el tamaño del texto
                            </p>
                        </div>
                        <Switch />
                    </div>
                </div>
            </div>
        </>
    )
}
