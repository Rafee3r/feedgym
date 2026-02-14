import { Header } from "@/components/layout/Header"
import { Composer } from "@/components/post/Composer"
import { MobileDashboard } from "@/components/mobile/MobileDashboard"
import { FeedWrapper } from "./FeedWrapper"

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
            <FeedWrapper />
        </>
    )
}
