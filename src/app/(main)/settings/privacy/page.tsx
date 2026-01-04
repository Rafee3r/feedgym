"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function PrivacySettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [settings, setSettings] = useState({
        showMetrics: true,
        discoverable: true,
        accountPrivacy: "PUBLIC",
        allowDMs: "EVERYONE",
    })

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/users/me")
                if (response.ok) {
                    const data = await response.json()
                    setSettings({
                        showMetrics: data.showMetrics,
                        discoverable: data.discoverable,
                        accountPrivacy: data.accountPrivacy,
                        allowDMs: data.allowDMs,
                    })
                }
            } catch (err) {
                console.error("Error fetching settings:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            })

            if (response.ok) {
                toast({
                    title: "Guardado",
                    description: "Tus preferencias de privacidad han sido actualizadas",
                    variant: "success",
                })
            } else {
                throw new Error("Error al guardar")
            }
        } catch {
            toast({
                title: "Error",
                description: "No se pudieron guardar los cambios",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <>
                <Header title="Privacidad" showBack />
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Privacidad" showBack />

            <div className="p-4 space-y-6">
                {/* Account Visibility */}
                <div className="space-y-4">
                    <h3 className="font-semibold">Visibilidad de la cuenta</h3>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Cuenta privada</Label>
                            <p className="text-sm text-muted-foreground">
                                Solo tus seguidores pueden ver tus posts
                            </p>
                        </div>
                        <Switch
                            checked={settings.accountPrivacy === "PRIVATE"}
                            onCheckedChange={(checked) =>
                                setSettings({
                                    ...settings,
                                    accountPrivacy: checked ? "PRIVATE" : "PUBLIC",
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Aparecer en búsqueda</Label>
                            <p className="text-sm text-muted-foreground">
                                Permitir que otros te encuentren
                            </p>
                        </div>
                        <Switch
                            checked={settings.discoverable}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, discoverable: checked })
                            }
                        />
                    </div>
                </div>

                <Separator />

                {/* Metrics */}
                <div className="space-y-4">
                    <h3 className="font-semibold">Métricas</h3>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Mostrar contadores</Label>
                            <p className="text-sm text-muted-foreground">
                                Mostrar seguidores y siguiendo en tu perfil
                            </p>
                        </div>
                        <Switch
                            checked={settings.showMetrics}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, showMetrics: checked })
                            }
                        />
                    </div>
                </div>

                <Separator />

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full rounded-full"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        "Guardar cambios"
                    )}
                </Button>
            </div>
        </>
    )
}
