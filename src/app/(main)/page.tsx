import { Suspense } from "react"
import { Header } from "@/components/layout/Header"
import { Composer } from "@/components/post/Composer"
import { Feed } from "./Feed"
import { FeedSkeleton } from "@/components/post/PostSkeleton"

import { MobileDashboard } from "@/components/mobile/MobileDashboard"

export default function HomePage() {
    return (
        <>
            <Header title="Inicio" />

            <MobileDashboard />

            {/* Composer */}
            <div className="hidden sm:block">
                <Composer />
            </div>

            {/* Feed */}
            <Suspense fallback={<FeedSkeleton />}>
                <Feed />
            </Suspense>
        </>
    )
}

