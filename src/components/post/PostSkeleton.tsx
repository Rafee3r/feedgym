import { Skeleton } from "@/components/ui/skeleton"

export function PostSkeleton() {
    return (
        <div className="border-b border-border px-4 py-3">
            <div className="flex gap-3">
                <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-8 mt-3">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-8" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function FeedSkeleton() {
    return (
        <div>
            {Array.from({ length: 5 }).map((_, i) => (
                <PostSkeleton key={i} />
            ))}
        </div>
    )
}
