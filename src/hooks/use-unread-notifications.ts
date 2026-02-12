"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

/**
 * Hook for unread notification count.
 * Uses a shared polling mechanism to avoid duplicate API calls.
 * Polls every 60 seconds (reduced from 30s to save bandwidth).
 */
export function useUnreadNotifications() {
    const { data: session } = useSession()
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications/unread")
            if (res.ok) {
                const data = await res.json()
                setUnreadCount(data.unreadCount)
            }
        } catch (error) {
            // Silently fail to not block UX
        }
    }, [])

    useEffect(() => {
        if (!session) return

        // Initial fetch
        fetchUnreadCount()

        // Poll every 60 seconds (reduced from 30s to save bandwidth)
        const interval = setInterval(fetchUnreadCount, 60000)

        // Listen for "notifications-read" event to clear count locally immediately
        const handleRead = () => setUnreadCount(0)
        window.addEventListener("notifications-read", handleRead)

        return () => {
            clearInterval(interval)
            window.removeEventListener("notifications-read", handleRead)
        }
    }, [session, fetchUnreadCount])

    return unreadCount
}
