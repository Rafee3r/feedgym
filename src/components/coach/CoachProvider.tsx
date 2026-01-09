"use client"

import { useMediaQuery } from "@/hooks/use-media-query"
import { CoachSidebar } from "./CoachSidebar"

export function CoachProvider() {
    const isDesktop = useMediaQuery("(min-width: 1024px)")

    // Only show sidebar on desktop - mobile access can be added to settings or profile
    if (!isDesktop) return null

    return <CoachSidebar />
}
