"use client"

import { useMediaQuery } from "@/hooks/use-media-query"
import { CoachSidebar } from "./CoachSidebar"
import { CoachMobile } from "./CoachMobile"

export function CoachProvider() {
    const isDesktop = useMediaQuery("(min-width: 1024px)")

    // On desktop, show sidebar; on mobile, show FAB + bottom sheet
    return isDesktop ? <CoachSidebar /> : <CoachMobile />
}
