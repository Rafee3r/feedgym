"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Dumbbell, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            })

            if (result?.error) {
                toast({
                    title: "Error",
                    description: "Email o contraseña incorrectos",
                    variant: "destructive",
                })
            } else {
                router.push("/")
                router.refresh()
            }
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
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo */}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
                        <Dumbbell className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold">Inicia sesión en FeedGym</h1>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
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
                            required
                            disabled={isLoading}
                        />
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
                            required
                            disabled={isLoading}
                        />
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
                                Iniciando sesión...
                            </>
                        ) : (
                            "Iniciar sesión"
                        )}
                    </Button>
                </form>

                {/* Forgot Password */}
                <div className="text-center text-sm">
                    <span className="text-muted-foreground">¿Olvidaste tu contraseña?</span>
                    <br />
                    <a
                        href="https://t.me/rafesy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                    >
                        Contacta a Rafesy @rafesy en Telegram
                    </a>
                </div>

                {/* Register Link */}
                <div className="text-center text-sm text-muted-foreground">
                    ¿No tienes cuenta?{" "}
                    <Link href="/register" className="text-primary hover:underline">
                        Regístrate
                    </Link>
                </div>
            </div>
        </div>
    )
}
