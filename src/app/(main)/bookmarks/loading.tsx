import { PostSkeleton } from "@/components/post/PostSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="md:w-[600px] w-full border-x border-border min-h-screen">
            <div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 p-4 border-b border-border">
                <Skeleton className="h-8 w-32" />
            </div>
            <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                    <PostSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}
