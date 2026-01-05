"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const PUBLIC_KEY = "BK7pzjnM-Z-Amec4MB7DXclrbBq8Zf4iUxivV7n2OUfRpPVNqf1MXUrY4o-0t4k22y0eLZTmBM0gpEreBIcq-K0"

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true)
            registerServiceWorker()
        } else {
            setIsLoading(false)
        }
    }, [])

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register("/sw.js", {
                scope: "/",
                updateViaCache: "none",
            })
            const sub = await registration.pushManager.getSubscription()
            setSubscription(sub)
        } catch (error) {
            console.error("Service Worker registration failed:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function subscribeToPush() {
        if (!isSupported) return
        setIsLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
            })

            setSubscription(sub)

            // Save to database
            const res = await fetch("/api/push/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sub),
            })

            if (!res.ok) throw new Error("Failed to save subscription")

            toast({
                title: "Notificaciones activadas",
                description: "Recibirás avisos en este dispositivo.",
                variant: "success"
            })
        } catch (error) {
            console.error("Subscription error:", error)
            const perm = Notification.permission
            if (perm === "denied") {
                toast({
                    title: "Permiso denegado",
                    description: "Por favor, permite las notificaciones en la configuración de tu navegador.",
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Error",
                    description: "No se pudieron activar las notificaciones.",
                    variant: "destructive"
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    async function unsubscribeFromPush() {
        if (!subscription) return
        setIsLoading(true)
        try {
            await subscription.unsubscribe()

            await fetch("/api/push/subscription", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ endpoint: subscription.endpoint }),
            })

            setSubscription(null)
            toast({ title: "Notificaciones desactivadas" })
        } catch (error) {
            console.error("Unsubscribe error:", error)
            toast({ title: "Error", description: "Ocurrió un error al desactivar.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    if (!isSupported) {
        return (
            <div className="p-4 border rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Tu navegador no soporta notificaciones Push.</p>
            </div>
        )
    }

    return (
        <div className="border border-border p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h3 className="font-semibold">Notificaciones Push</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Recibe alertas inmediatas en tu dispositivo (PC o Móvil) sobre respuestas y actividad importante.
                </p>
            </div>
            {isLoading ? (
                <Button disabled variant="outline">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando
                </Button>
            ) : subscription ? (
                <Button variant="outline" onClick={unsubscribeFromPush} className="w-full sm:w-auto">
                    <BellOff className="mr-2 h-4 w-4" /> Desactivar
                </Button>
            ) : (
                <Button onClick={subscribeToPush} className="w-full sm:w-auto">
                    <Bell className="mr-2 h-4 w-4" /> Activar
                </Button>
            )}
        </div>
    )
}
