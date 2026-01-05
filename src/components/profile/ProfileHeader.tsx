"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    Calendar,
    MapPin,
    Link as LinkIcon,
    Dumbbell,
    Target,
    BadgeCheck,
    ShieldAlert
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { getInitials, formatNumber } from "@/lib/utils"
import type { GoalType, PersonalRecordData } from "@/types"
import { AdminControls } from "@/components/admin/AdminControls"

interface ProfileHeaderProps {
    profile: {
        id: string
        username: string
        displayName: string
        bio: string | null
        avatarUrl: string | null
        bannerUrl: string | null
        location: string | null
        website: string | null
        pronouns: string | null
        gymSplit: string | null
        goal: GoalType
        createdAt: Date
        followersCount: number | null
        followingCount: number | null
        postsCount: number
        isFollowing: boolean
        isFollowedBy: boolean
        isOwnProfile: boolean
        personalRecords: PersonalRecordData[]
        role?: "USER" | "ADMIN" | "STAFF"
        // Admin controls
        isBanned?: boolean
        isShadowbanned?: boolean
        isFrozen?: boolean
        mutedUntil?: Date | string | null
    }
}

const goalLabels: Record<GoalType, string> = {
    CUT: "🔥 Definición",
    BULK: "💪 Volumen",
    MAINTAIN: "⚖️ Mantenimiento",
    RECOMP: "🔄 Recomposición",
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
    const router = useRouter()
    const [isFollowing, setIsFollowing] = useState(profile.isFollowing)
    const [isLoading, setIsLoading] = useState(false)

    const handleFollow = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/users/${profile.username}/follow`, {
                method: "POST",
            })

            if (response.ok) {
                const data = await response.json()
                setIsFollowing(data.following)
                toast({
                    title: data.following ? "Siguiendo" : "Dejaste de seguir",
                    description: data.following
                        ? `Ahora sigues a @${profile.username}`
                        : `Dejaste de seguir a @${profile.username}`,
                })
            }
        } catch {
            toast({
                title: "Error",
                description: "No se pudo completar la acción",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            {/* Banner */}
            <div
                className="profile-banner bg-cover bg-center"
                style={
                    profile.bannerUrl
                        ? { backgroundImage: `url(${profile.bannerUrl})` }
                        : undefined
                }
            />

            {/* Profile Info */}
            <div className="px-4 pb-4">
                {/* Avatar and Actions */}
                <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-3">
                    <Avatar className="w-20 h-20 sm:w-32 sm:h-32 border-4 border-background">
                        <AvatarImage src={profile.avatarUrl || undefined} />
                        <AvatarFallback className="text-2xl sm:text-4xl">
                            {getInitials(profile.displayName)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex gap-2 mt-16 sm:mt-20 items-center">
                        {profile.isBanned !== undefined && (
                            <AdminControls
                                userId={profile.id}
                                username={profile.username}
                                status={{
                                    isBanned: profile.isBanned!,
                                    isShadowbanned: profile.isShadowbanned!,
                                    isFrozen: profile.isFrozen!,
                                    mutedUntil: profile.mutedUntil!
                                }}
                            />
                        )}

                        {profile.isOwnProfile ? (
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => router.push("/settings/profile")}
                            >
                                Editar perfil
                            </Button>
                        ) : (
                            <Button
                                variant={isFollowing ? "outline" : "default"}
                                className="rounded-full min-w-[100px]"
                                onClick={handleFollow}
                                disabled={isLoading}
                            >
                                {isFollowing ? "Siguiendo" : "Seguir"}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Name and Username */}
                <div className="mb-3">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        {profile.displayName}
                        {profile.role === "STAFF" && (
                            <span className="bg-blue-500/10 text-blue-500 p-1 rounded-full" title="Staff">
                                <BadgeCheck className="w-4 h-4" />
                            </span>
                        )}
                        {profile.role === "ADMIN" && (
                            <span className="bg-red-500/10 text-red-500 p-1 rounded-full" title="Admin">
                                <ShieldAlert className="w-4 h-4" />
                            </span>
                        )}
                        {/* Pronouns */}
                        {profile.pronouns && (
                            <span className="text-sm font-normal text-muted-foreground">
                                ({profile.pronouns})
                            </span>
                        )}
                    </h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    {profile.isFollowedBy && !profile.isOwnProfile && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                            Te sigue
                        </span>
                    )}
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="mb-3 whitespace-pre-wrap">{profile.bio}</p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                    {profile.location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {profile.location}
                        </span>
                    )}
                    {profile.website && (
                        <a
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                        >
                            <LinkIcon className="w-4 h-4" />
                            {new URL(profile.website).hostname}
                        </a>
                    )}
                    <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Se unió en {format(new Date(profile.createdAt), "MMMM yyyy", { locale: es })}
                    </span>
                </div>

                {/* Fitness Info */}
                <div className="flex flex-wrap gap-3 mb-3">
                    {profile.gymSplit && (
                        <span className="flex items-center gap-1 text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                            <Dumbbell className="w-3.5 h-3.5" />
                            {profile.gymSplit}
                        </span>
                    )}
                    <span className="flex items-center gap-1 text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                        <Target className="w-3.5 h-3.5" />
                        {goalLabels[profile.goal]}
                    </span>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm">
                    <Link
                        href={`/${profile.username}/following`}
                        className="hover:underline"
                    >
                        <span className="font-bold">
                            {profile.followingCount !== null
                                ? formatNumber(profile.followingCount)
                                : "—"}
                        </span>{" "}
                        <span className="text-muted-foreground">Siguiendo</span>
                    </Link>
                    <Link
                        href={`/${profile.username}/followers`}
                        className="hover:underline"
                    >
                        <span className="font-bold">
                            {profile.followersCount !== null
                                ? formatNumber(profile.followersCount)
                                : "—"}
                        </span>{" "}
                        <span className="text-muted-foreground">Seguidores</span>
                    </Link>
                </div>

                {/* PRs */}
                {profile.personalRecords.length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-xl">
                        <h3 className="font-semibold text-sm mb-2">🏆 Records Personales</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {profile.personalRecords.map((pr) => (
                                <div
                                    key={pr.id}
                                    className="bg-background rounded-lg p-2 text-center"
                                >
                                    <p className="font-semibold text-primary">
                                        {pr.weight} {pr.unit}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{pr.exercise}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
