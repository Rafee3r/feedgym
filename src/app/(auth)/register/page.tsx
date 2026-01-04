"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dumbbell, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        username: "",
        displayName: "",
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

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
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo */}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
                        <Dumbbell className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold">Únete a FeedGym</h1>
                    <p className="text-muted-foreground text-center mt-2">
                        Comparte tu progreso con la comunidad fitness
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Nombre <span className="text-muted-foreground text-xs font-normal">(Opcional)</span></Label>
                        <Input
                            id="displayName"
                            type="text"
                            placeholder="Tu nombre"
                            value={formData.displayName}
                            onChange={(e) =>
                                setFormData({ ...formData, displayName: e.target.value })
                            }
                            disabled={isLoading}
                        />
                        {errors.displayName && (
                            <p className="text-sm text-destructive">{errors.displayName}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="tu_username"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({ ...formData, username: e.target.value.toLowerCase() })
                            }
                            disabled={isLoading}
                        />
                        {errors.username && (
                            <p className="text-sm text-destructive">{errors.username}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            disabled={isLoading}
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, confirmPassword: e.target.value })
                                }
                                disabled={isLoading}
                                className={formData.confirmPassword && formData.password === formData.confirmPassword ? "border-green-500 pr-10" : ""}
                            />
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
                                    <Check className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full rounded-full"
                        size="lg"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creando cuenta...
                            </>
                        ) : (
                            "Crear cuenta"
                        )}
                    </Button>
                </form>

                {/* Terms */}
                <p className="text-xs text-muted-foreground text-center">
                    Al registrarte, aceptas nuestros{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                        Términos
                    </Link>{" "}
                    y{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                        Política de Privacidad
                    </Link>
                </p>

                {/* Login Link */}
                <div className="text-center text-sm text-muted-foreground">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Inicia sesión
                    </Link>
                </div>
            </div>
        </div>
    )
}
