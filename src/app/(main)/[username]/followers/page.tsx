import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Header } from "@/components/layout/Header"
import { UserList } from "@/components/shared/UserList"

interface FollowersPageProps {
    params: Promise<{ username: string }>
}

export default async function FollowersPage({ params }: FollowersPageProps) {
    const { username } = await params
    const session = await auth()

    const user = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
        select: { id: true, displayName: true },
    })

    if (!user) {
        return <div className="p-4">Usuario no encontrado</div>
    }

    const followers = await prisma.follow.findMany({
        where: { followingId: user.id },
        include: {
            follower: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    bio: true,
                },
            },
        },
    })

    // Transform data for UI and check if current user follows them
    const usersWithFollowStatus = await Promise.all(
        followers.map(async (f) => {
            const isFollowing = session
                ? await prisma.follow.findFirst({
                    where: {
                        followerId: session.user.id,
                        followingId: f.follower.id,
                    },
                })
                : null
            return {
                ...f.follower,
                isFollowing: !!isFollowing,
            }
        })
    )

    return (
        <>
            <Header title={`Seguidores de ${user.displayName}`} showBack />
            <UserList users={usersWithFollowStatus} currentUserId={session?.user.id} />
        </>
    )
}
