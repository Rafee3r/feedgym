"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"

export default function RegisterPage() {
    const router = useRouter()
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        username: "",
        displayName: "",
        invitationCode: "",
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        setMounted(true)
    }, [])

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.email) {
            newErrors.email = "El email es requerido"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email inválido"
        }

        if (!formData.password) {
            newErrors.password = "La contraseña es requerida"
        } else if (formData.password.length < 8) {
            newErrors.password = "Mínimo 8 caracteres"
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden"
        }

        if (!formData.username) {
            newErrors.username = "El username es requerido"
        } else if (formData.username.length < 3) {
            newErrors.username = "Mínimo 3 caracteres"
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = "Solo letras, números y guiones bajos"
        }

        /* if (!formData.displayName) {
            newErrors.displayName = "El nombre es requerido"
        } */

        if (!formData.invitationCode) {
            newErrors.invitationCode = "Código requerido"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsLoading(true)

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    username: formData.username,
                    displayName: formData.displayName,
                    invitationCode: formData.invitationCode,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: data.error || "Error al registrar",
                    variant: "destructive",
                })
                return
            }

            toast({
                title: "¡Cuenta creada!",
                description: "Ahora puedes iniciar sesión",
                variant: "success",
            })

            router.push("/login")
        } catch {
            toast({
                title: "Error",
                description: "Algo salió mal. Inténtalo de nuevo.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background py-8">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-500">
                {/* Logo */}
                <div className="flex flex-col items-center">
                    <img
                        src="/logo-dark.png"
                        alt="FeedGym"
                        className="h-16 w-auto mb-8 object-contain"
                    />
                    <h1 className="text-2xl font-bold tracking-tight">Únete a FeedGym</h1>
                    <p className="text-sm text-muted-foreground mt-2">Comienza tu viaje hoy</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                id="displayName"
                                type="text"
                                placeholder="Nombre (Opcional)"
                                value={formData.displayName}
                                onChange={(e) =>
                                    setFormData({ ...formData, displayName: e.target.value })
                                }
                                disabled={isLoading}
                                className="bg-transparent border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50 h-12"
                            />
                            {errors.displayName && (
                                <p className="text-xs text-destructive">{errors.displayName}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="username"
                                type="text"
                                placeholder="Username"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({ ...formData, username: e.target.value.toLowerCase() })
                                }
                                disabled={isLoading}
                                className="bg-transparent border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50 h-12"
                            />
                            {errors.username && (
                                <p className="text-xs text-destructive">{errors.username}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="email"
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                disabled={isLoading}
                                className="bg-transparent border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50 h-12"
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="password"
                                type="password"
                                placeholder="Contraseña"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                disabled={isLoading}
                                className="bg-transparent border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50 h-12"
                            />
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password}</p>
                            )}
                        </div>

                        <div className="space-y-2 relative">
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirmar contraseña"
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, confirmPassword: e.target.value })
                                }
                                disabled={isLoading}
                                className="bg-transparent border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50 h-12 pr-8"
                            />
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                                    <Check className="w-4 h-4" />
                                </div>
                            )}
                            {errors.confirmPassword && (
                                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Input
                                id="invitationCode"
                                type="text"
                                placeholder="Código de invitación"
                                value={formData.invitationCode}
                                onChange={(e) =>
                                    setFormData({ ...formData, invitationCode: e.target.value.toUpperCase() })
                                }
                                disabled={isLoading}
                                className="bg-transparent border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50 h-12 tracking-wide"
                            />
                            {errors.invitationCode && (
                                <p className="text-xs text-destructive">{errors.invitationCode}</p>
                            )}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full rounded-full h-12 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                        size="lg"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creando cuenta...
                            </>
                        ) : (
                            "Registrarse"
                        )}
                    </Button>
                </form>

                {/* Login Link */}
                <div className="text-center text-sm text-muted-foreground pb-8">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                        Rellena tus datos
                    </Link>
                </div>
            </div>
        </div>
    )
}
