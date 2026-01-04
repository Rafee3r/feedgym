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
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Algo salió mal. Inténtalo de nuevo.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-500">
                {/* Logo */}
                <div className="flex flex-col items-center">
                    <img src="/logo.png" alt="FeedGym" className="h-20 w-auto mb-8 object-contain" />
                    <h1 className="text-2xl font-bold tracking-tight">Bienvenido de nuevo</h1>
                    <p className="text-sm text-muted-foreground mt-2">Ingresa a tu espacio de entrenamiento</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                id="email"
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                required
                                disabled={isLoading}
                                className="bg-transparent border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50 h-12 text-lg"
                            />
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
                                required
                                disabled={isLoading}
                                className="bg-transparent border-0 border-b border-input rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50 h-12 text-lg"
                            />
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
                                Entrando...
                            </>
                        ) : (
                            "Iniciar sesión"
                        )}
                    </Button>
                </form>

                {/* Footer Links */}
                <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground">
                    <Link
                        href="/register"
                        className="hover:text-primary transition-colors hover:underline"
                    >
                        ¿No tienes cuenta? <span className="text-primary font-medium">Regístrate</span>
                    </Link>

                    <a
                        href="https://t.me/rafesy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:text-foreground transition-colors"
                    >
                        ¿Problemas para entrar? Contacta soporte
                    </a>
                </div>
            </div>
        </div>
    )
}
