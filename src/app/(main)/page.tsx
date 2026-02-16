import { Suspense } from "react"
import { Header } from "@/components/layout/Header"
import { Composer } from "@/components/post/Composer"
import { MobileDashboard } from "@/components/mobile/MobileDashboard"
import { Feed } from "./Feed"
import { FeedSkeleton } from "@/components/post/PostSkeleton"

export default function HomePage() {
    return (
        <>
            <Header />

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
