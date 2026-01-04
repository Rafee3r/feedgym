"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/utils"

interface UserListProps {
    users: {
        id: string
        username: string
        displayName: string
        avatarUrl: string | null
        bio: string | null
        isFollowing: boolean
    }[]
    currentUserId?: string
}

export function UserList({ users, currentUserId }: UserListProps) {
    if (users.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>No se encontraron usuarios.</p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-border">
            {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                    <Link href={`/${user.username}`}>
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                        </Avatar>
                    </Link>

                    <div className="flex-1 min-w-0">
                        <Link href={`/${user.username}`} className="block group">
                            <span className="font-bold text-sm block group-hover:underline truncate">
                                {user.displayName}
                            </span>
                            <span className="text-muted-foreground text-xs block truncate">
                                @{user.username}
                            </span>
                        </Link>
                        {user.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {user.bio}
                            </p>
                        )}
                    </div>

                    {currentUserId !== user.id && (
                        <Button variant={user.isFollowing ? "outline" : "secondary"} size="sm" className="rounded-full">
                            {user.isFollowing ? "Siguiendo" : "Seguir"}
                        </Button>
                    )}
                </div>
            ))}
        </div>
    )
}
