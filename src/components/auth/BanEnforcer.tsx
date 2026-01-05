"use client"

import { useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { toast } from "@/hooks/use-toast"

/**
 * Polls the server to check if the current user has been banned.
 * If banned, forces immediate logout.
 */
export function BanEnforcer() {
    const { data: session, status } = useSession()

    const checkBanStatus = useCallback(async () => {
        if (!session?.user?.id) return

        try {
            const response = await fetch("/api/auth/check-ban")
            if (response.ok) {
                const data = await response.json()
                if (data.isBanned) {
                    toast({
                        title: "Cuenta suspendida",
                        description: "Tu cuenta ha sido baneada. Serás desconectado.",
                        variant: "destructive",
                    })
                    // Force logout after showing toast
                    setTimeout(() => {
                        signOut({ callbackUrl: "/login" })
                    }, 2000)
                }
            }
        } catch (error) {
            console.error("Error checking ban status:", error)
        }
    }, [session?.user?.id])

    useEffect(() => {
        if (status !== "authenticated") return

        // Check immediately on mount
        checkBanStatus()

        // Then check every 30 seconds
        const interval = setInterval(checkBanStatus, 30000)

        return () => clearInterval(interval)
    }, [status, checkBanStatus])

    // This component renders nothing
    return null
}
