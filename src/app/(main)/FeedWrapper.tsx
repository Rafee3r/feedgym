"use client"

import dynamic from "next/dynamic"
import { FeedSkeleton } from "@/components/post/PostSkeleton"

// Client-only: Feed reads localStorage on first render, must NOT run on server
const Feed = dynamic(() => import("./Feed").then(m => m.Feed), {
    ssr: false,
    loading: () => <FeedSkeleton />,
})

export function FeedWrapper() {
    return <Feed />
}
