"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export function useUnreadNotifications() {
    const { data: session } = useSession()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!session) return

        const fetchUnreadCount = async () => {
            try {
                const res = await fetch("/api/notifications/unread")
                if (res.ok) {
                    const data = await res.json()
                    setUnreadCount(data.unreadCount)
                }
            } catch (error) {
                console.error("Error checking notifications:", error)
            }
        }

        // Initial fetch
        fetchUnreadCount()

        // Poll every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000)

        // Listen for "notifications-read" event to clear count locally immediately
        const handleRead = () => setUnreadCount(0)
        window.addEventListener("notifications-read", handleRead)

        return () => {
            clearInterval(interval)
            window.removeEventListener("notifications-read", handleRead)
        }
    }, [session])

    return unreadCount
}
