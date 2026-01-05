"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { LogOut, Smartphone, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function SecuritySettingsPage() {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({
                title: "Error",
                description: "Por favor completa todos los campos",
                variant: "destructive",
            })
            return
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "Las nuevas contraseñas no coinciden",
                variant: "destructive",
            })
            return
        }

        if (newPassword.length < 8) {
            toast({
                title: "Error",
                description: "La nueva contraseña debe tener al menos 8 caracteres",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/users/me/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar contraseña")
            }

            toast({
                title: "Contraseña actualizada",
                description: "Tu contraseña ha sido cambiada exitosamente",
                variant: "success",
            })

            // Reset form
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Header title="Seguridad" showBack />

            <div className="p-4 space-y-6">
                {/* Change Password */}
                <div className="space-y-4">
                    <h3 className="font-semibold">Cambiar contraseña</h3>

                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Contraseña actual</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva contraseña</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <Button
                        className="w-full rounded-full"
                        onClick={handleUpdatePassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Actualizando...
                            </>
                        ) : (
                            "Actualizar contraseña"
                        )}
                    </Button>
                </div>

                <Separator />

                {/* Active Sessions */}
                <div className="space-y-4">
                    <h3 className="font-semibold">Sesiones activas</h3>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                            <Smartphone className="w-5 h-5" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">Esta sesión</p>
                                <p className="text-xs text-muted-foreground">
                                    Windows · Chrome · Ahora
                                </p>
                            </div>
                            <span className="text-xs text-primary">Activa</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full rounded-full">
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar otras sesiones
                    </Button>
                </div>

                <Separator />

                {/* Danger Zone */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Zona de peligro
                    </h3>

                    <Button
                        variant="outline"
                        className="w-full rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => signOut({ callbackUrl: window.location.origin + "/login" })}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar sesión
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        Eliminar cuenta
                    </Button>
                </div>
            </div>
        </>
    )
}
