import { PostSkeleton } from "@/components/post/PostSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="md:w-[600px] w-full border-x border-border min-h-screen">
            <div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 p-4 border-b border-border">
                <Skeleton className="h-8 w-32" />
            </div>

            <div className="mt-4 px-4 w-full">
                <Skeleton className="h-10 w-full rounded-full" />
                <div className="mt-4 flex gap-2 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
                    ))}
                </div>
            </div>

            <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                    <PostSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}
