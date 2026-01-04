import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="md:w-[600px] w-full border-x border-border min-h-screen p-4 space-y-6">
            <Skeleton className="h-8 w-40 mb-6" />

            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>

            <Skeleton className="h-px w-full my-6" />

            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    )
}
