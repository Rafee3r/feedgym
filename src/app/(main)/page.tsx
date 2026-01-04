import { Suspense } from "react"
import { Header } from "@/components/layout/Header"
import { Composer } from "@/components/post/Composer"
import { Feed } from "./Feed"
import { FeedSkeleton } from "@/components/post/PostSkeleton"

export default function HomePage() {
    return (
        <>
            <Header title="Inicio" />

            {/* Composer */}
            <div className="hidden sm:block">
                <Composer />
            </div>

            {/* Feed */}
            <Suspense fallback={<FeedSkeleton />}>
                <Feed />
            </Suspense>

            {/* Mobile FAB */}
            <button className="fab">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>
        </>
    )
}
