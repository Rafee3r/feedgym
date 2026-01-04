import { PostSkeleton } from "@/components/post/PostSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="md:w-[600px] w-full border-x border-border min-h-screen">
            {/* Header/Banner Skeleton */}
            <Skeleton className="h-32 w-full" />
            <div className="px-4 pb-4">
                <div className="flex justify-between items-end -mt-10 mb-4">
                    <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
                    <Skeleton className="h-9 w-24 rounded-full" />
                </div>

                {/* Profile Info */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-6 flex border-b border-border">
                    <div className="flex-1 py-3"><Skeleton className="h-6 w-16 mx-auto" /></div>
                    <div className="flex-1 py-3"><Skeleton className="h-6 w-16 mx-auto" /></div>
                    <div className="flex-1 py-3"><Skeleton className="h-6 w-16 mx-auto" /></div>
                    <div className="flex-1 py-3"><Skeleton className="h-6 w-16 mx-auto" /></div>
                </div>
            </div>

            {/* Posts */}
            <div className="divide-y divide-border">
                {[1, 2, 3].map((i) => (
                    <PostSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}
