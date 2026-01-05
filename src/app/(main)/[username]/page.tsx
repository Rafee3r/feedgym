import { notFound } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { ProfileTabs } from "@/components/profile/ProfileTabs"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface ProfilePageProps {
    params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ProfilePageProps) {
    const { username } = await params
    const user = await prisma.user.findFirst({
        where: { username: username.toLowerCase() },
        select: { displayName: true, username: true, bio: true },
    })

    if (!user) {
        return { title: "Usuario no encontrado | FeedGym" }
    }

    return {
        title: `${user.displayName} (@${user.username}) | FeedGym`,
        description: user.bio || `Perfil de ${user.displayName} en FeedGym`,
    }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params
    const session = await auth()

    const user = await prisma.user.findFirst({
        where: { username: username.toLowerCase() },
        select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            bannerUrl: true,
            location: true,
            website: true,
            pronouns: true,
            gymSplit: true,
            trainingDays: true,
            goal: true,
            accountPrivacy: true,
            showMetrics: true,
            createdAt: true,
            role: true, // Fetch role
            // Admin fields (conditionally fetched effectively, but we select them here if user is admin)
            ...(session?.user.role === "ADMIN" || session?.user.role === "STAFF"
                ? {
                    isBanned: true,
                    isShadowbanned: true,
                    isFrozen: true,
                    mutedUntil: true,
                }
                : {}),
            _count: {
                select: {
                    posts: { where: { deletedAt: null, parentId: null } },
                    followedBy: true,
                    following: true,
                },
            },
        },
    })

    if (!user) {
        notFound()
    }

    // Check follow status
    let isFollowing = false
    let isFollowedBy = false

    if (session && session.user.id !== user.id) {
        const [following, followedBy] = await Promise.all([
            prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: session.user.id,
                        followingId: user.id,
                    },
                },
            }),
            prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: user.id,
                        followingId: session.user.id,
                    },
                },
            }),
        ])
        isFollowing = !!following
        isFollowedBy = !!followedBy
    }

    // Get PRs
    const personalRecords = await prisma.personalRecord.findMany({
        where: { userId: user.id },
        orderBy: { weight: "desc" },
        take: 3,
    })

    const profile = {
        ...user,
        followersCount: user.showMetrics ? user._count.followedBy : null,
        followingCount: user.showMetrics ? user._count.following : null,
        postsCount: user._count.posts,
        isFollowing,
        isFollowedBy,
        isOwnProfile: session?.user.id === user.id,
        personalRecords: personalRecords.map((pr) => ({
            id: pr.id,
            exercise: pr.exercise,
            weight: pr.weight,
            unit: pr.unit,
            reps: pr.reps,
            achievedAt: pr.achievedAt,
        })),
    }

    return (
        <>
            <Header title={user.displayName} showBack />
            <ProfileHeader profile={profile} />
            <ProfileTabs username={user.username} userId={user.id} />
        </>
    )
}
