"use client"

import { useState, useEffect } from "react"
import { InactivityLockScreen } from "./InactivityLockScreen"

interface InactivityGuardProps {
    children: React.ReactNode
}

export function InactivityGuard({ children }: InactivityGuardProps) {
    const [isLocked, setIsLocked] = useState(false)
    const [isChecking, setIsChecking] = useState(true)

    const checkInactivity = async () => {
        try {
            const res = await fetch("/api/user/inactivity-check")
            if (!res.ok) {
                // If the check fails, let the user through (fail-open)
                setIsLocked(false)
                return
            }
            const data = await res.json()
            setIsLocked(data.locked === true)
        } catch {
            // Network error — fail open, don't block users
            setIsLocked(false)
        } finally {
            setIsChecking(false)
        }
    }

    useEffect(() => {
        checkInactivity()
    }, [])

    const handleUnlocked = () => {
        setIsLocked(false)
    }

    // While checking, don't render anything (layout already shows)
    // This avoids a flash of locked/unlocked content
    if (isChecking) {
        return <>{children}</>
    }

    if (isLocked) {
        return <InactivityLockScreen onUnlocked={handleUnlocked} />
    }

    return <>{children}</>
}
