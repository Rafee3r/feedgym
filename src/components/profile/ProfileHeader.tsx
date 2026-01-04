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
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { getInitials, formatNumber } from "@/lib/utils"
import type { GoalType, PersonalRecordData } from "@/types"

import { BadgeCheck, ShieldAlert } from "lucide-react"

// ... imports

profile: {
    // ... existing props
    role ?: "USER" | "ADMIN" | "STAFF" // Add role
}
}

// ... inside component

{/* Name and Username */ }
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
// ... rest of code

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
        </div >
    )
}
