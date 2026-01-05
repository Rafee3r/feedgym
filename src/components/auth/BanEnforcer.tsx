"use client"

import { useEffect, useCallback, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { toast } from "@/hooks/use-toast"

/**
 * Polls the server to check if the current user has been banned.
 * If banned, forces immediate logout.
 */
export function BanEnforcer() {
    const { data: session, status } = useSession()
    const isCheckingRef = useRef(false)
    const hasLoggedOutRef = useRef(false)

    const checkBanStatus = useCallback(async () => {
        // Prevent concurrent checks and multiple logouts
        if (isCheckingRef.current || hasLoggedOutRef.current) return
        if (status !== "authenticated" || !session?.user?.id) return

        isCheckingRef.current = true

        try {
            const response = await fetch("/api/auth/check-ban")
            if (response.ok) {
                const data = await response.json()
                if (data.isBanned && !hasLoggedOutRef.current) {
                    hasLoggedOutRef.current = true
                    toast({
                        title: "Cuenta suspendida",
                        description: "Tu cuenta ha sido baneada. Serás desconectado.",
                        variant: "destructive",
                    })
                    // Force logout after showing toast
                    setTimeout(() => {
                        signOut({ callbackUrl: "/login", redirect: true })
                    }, 1500)
                }
            }
        } catch (error) {
            // Silently fail - don't block user experience
            console.error("Error checking ban status:", error)
        } finally {
            isCheckingRef.current = false
        }
    }, [session?.user?.id, status])

    useEffect(() => {
        if (status !== "authenticated" || !session?.user) return

        // Check immediately on mount
        checkBanStatus()

        // Then check every 30 seconds
        const interval = setInterval(checkBanStatus, 30000)

        return () => clearInterval(interval)
    }, [status, session?.user, checkBanStatus])

    // This component renders nothing
    return null
}
