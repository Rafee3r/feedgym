import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { PostDetail } from "./PostDetail"
import { FeedSkeleton } from "@/components/post/PostSkeleton"
import prisma from "@/lib/prisma"

interface PostPageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PostPageProps) {
    const { id } = await params
    const post = await prisma.post.findUnique({
        where: { id },
        select: {
            content: true,
            author: { select: { displayName: true, username: true } },
        },
    })

    if (!post) {
        return { title: "Post no encontrado | FeedGym" }
    }

    const preview = post.content.slice(0, 100)
    return {
        title: `${post.author.displayName} en FeedGym: "${preview}..."`,
        description: post.content.slice(0, 200),
    }
}

export default async function PostPage({ params }: PostPageProps) {
    const { id } = await params

    const postExists = await prisma.post.findUnique({
        where: { id, deletedAt: null },
        select: { id: true },
    })

    if (!postExists) {
        notFound()
    }

    return (
        <>
            <Header title="Post" showBack />
            <Suspense fallback={<FeedSkeleton />}>
                <PostDetail postId={id} />
            </Suspense>
        </>
    )
}
