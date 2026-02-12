"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useSession } from "next-auth/react"

interface UserData {
    id: string
    email: string
    username: string
    displayName: string | null
    bio: string | null
    avatarUrl: string | null
    bannerUrl: string | null
    location: string | null
    website: string | null
    pronouns: string | null
    gymSplit: string | null
    trainingDays: number[]
    goal: string | null
    targetWeight: number | null
    caloriesTarget: number | null
    proteinTarget: number | null
    carbsTarget: number | null
    fatsTarget: number | null
    accountPrivacy: string
    allowDMs: string
    showMetrics: boolean
    discoverable: boolean
    createdAt: string
}

interface UserContextType {
    user: UserData | null
    unreadNotifications: number
    isBanned: boolean
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
    updateUnreadCount: (count: number) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession()
    const [user, setUser] = useState<UserData | null>(null)
    const [unreadNotifications, setUnreadNotifications] = useState(0)
    const [isBanned, setIsBanned] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchUserSummary = useCallback(async () => {
        if (status !== "authenticated" || !session?.user?.id) {
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch("/api/users/me/summary")
            if (response.ok) {
                const data = await response.json()
                setUser(data.user)
                setUnreadNotifications(data.unreadNotifications ?? 0)
                setIsBanned(data.isBanned ?? false)
                setError(null)
            } else {
                setError("Failed to fetch user data")
            }
        } catch (e) {
            console.error("UserContext fetch error:", e)
            setError("Network error")
        } finally {
            setIsLoading(false)
        }
    }, [session?.user?.id, status])

    // Initial fetch
    useEffect(() => {
        if (status === "authenticated") {
            fetchUserSummary()
        } else if (status === "unauthenticated") {
            setIsLoading(false)
            setUser(null)
        }
    }, [status, fetchUserSummary])

    // Periodic refresh for notifications (every 60 seconds)
    useEffect(() => {
        if (status !== "authenticated") return

        const interval = setInterval(() => {
            // Only refresh notification count, not full user data
            fetch("/api/notifications/unread")
                .then(res => res.json())
                .then(data => setUnreadNotifications(data.unreadCount ?? 0))
                .catch(() => { })
        }, 60000)

        return () => clearInterval(interval)
    }, [status])

    const updateUnreadCount = useCallback((count: number) => {
        setUnreadNotifications(count)
    }, [])

    return (
        <UserContext.Provider
            value={{
                user,
                unreadNotifications,
                isBanned,
                isLoading,
                error,
                refetch: fetchUserSummary,
                updateUnreadCount,
            }}
        >
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider")
    }
    return context
}

// Hook for components that only need user data (backwards compatible)
export function useCurrentUser() {
    const { user, isLoading } = useUser()
    return { user, isLoading }
}
