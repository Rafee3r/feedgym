import dynamic from "next/dynamic"
import { Header } from "@/components/layout/Header"
import { Composer } from "@/components/post/Composer"
import { FeedSkeleton } from "@/components/post/PostSkeleton"
import { MobileDashboard } from "@/components/mobile/MobileDashboard"

// Client-only: Feed reads localStorage on first render, so it must NOT run on the server
const Feed = dynamic(() => import("./Feed").then(m => m.Feed), {
    ssr: false,
    loading: () => <FeedSkeleton />,
})

export default function HomePage() {
    return (
        <>
            <Header />

            <MobileDashboard />

            {/* Composer */}
            <div className="hidden sm:block">
                <Composer />
            </div>

            {/* Feed - client only, instant cache hydration */}
            <Feed />
        </>
    )
}
