import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Header } from "@/components/layout/Header"
import { UserList } from "@/components/shared/UserList"

interface FollowingPageProps {
    params: Promise<{ username: string }>
}

export default async function FollowingPage({ params }: FollowingPageProps) {
    const { username } = await params
    const session = await auth()

    const user = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
        select: { id: true, displayName: true },
    })

    if (!user) {
        return <div className="p-4">Usuario no encontrado</div>
    }

    const following = await prisma.follow.findMany({
        where: { followerId: user.id },
        include: {
            following: {
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
        following.map(async (f) => {
            const isFollowing = session
                ? await prisma.follow.findFirst({
                    where: {
                        followerId: session.user.id,
                        followingId: f.following.id,
                    },
                })
                : null
            return {
                ...f.following,
                isFollowing: !!isFollowing,
            }
        })
    )

    return (
        <>
            <Header title={`Seguirdos por ${user.displayName}`} showBack />
            <UserList users={usersWithFollowStatus} currentUserId={session?.user.id} />
        </>
    )
}
