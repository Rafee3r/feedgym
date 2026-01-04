"use client"

import { signOut } from "next-auth/react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { LogOut, Smartphone, AlertTriangle } from "lucide-react"

export default function SecuritySettingsPage() {
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
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva contraseña</Label>
                        <Input id="newPassword" type="password" placeholder="••••••••" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                        />
                    </div>

                    <Button className="w-full rounded-full">Actualizar contraseña</Button>
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
