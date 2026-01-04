import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/users/[username] - Get user profile
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params
        const session = await auth()

        const user = await prisma.user.findUnique({
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
                _count: {
                    select: {
                        posts: { where: { deletedAt: null, parentId: null } },
                        followers: true,
                        following: true,
                    },
                },
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 404 }
            )
        }

        // Check if current user follows this user
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

        // Get top 3 PRs
        const personalRecords = await prisma.personalRecord.findMany({
            where: { userId: user.id },
            orderBy: { weight: "desc" },
            take: 3,
        })

        return NextResponse.json({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            bannerUrl: user.bannerUrl,
            location: user.location,
            website: user.website,
            pronouns: user.pronouns,
            gymSplit: user.gymSplit,
            trainingDays: user.trainingDays,
            goal: user.goal,
            createdAt: user.createdAt,
            followersCount: user.showMetrics ? user._count.followers : null,
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
        })
    } catch (error) {
        console.error("Get user error:", error)
        return NextResponse.json(
            { error: "Error al obtener usuario" },
            { status: 500 }
        )
    }
}
