"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts"
import { Scale, Users, Loader2, Plus, TrendingUp, TrendingDown, Minus, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { getInitials } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import type { WeightChartData } from "@/types"
import { ConsistencyCard, type ActivityData } from "@/components/consistency/ConsistencyCard"
import { WeightSummaryCard } from "@/components/dashboard/WeightSummaryCard"

interface SuggestedUser {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isFollowing: boolean
}

interface ProfileUser {
    id: string
    displayName: string
}

type TimePeriod = "3M" | "6M" | "MAX"

export function RightPanel() {
    const { data: session } = useSession()
    const pathname = usePathname()

    // Detect if on a profile page (URL like /username where username is not a reserved route)
    const reservedRoutes = ['search', 'notifications', 'bookmarks', 'settings', 'terms', 'privacy', 'about']
    const pathParts = pathname.split('/').filter(Boolean)
    const isProfilePage = pathParts.length === 1 && !reservedRoutes.includes(pathParts[0])
    const profileUsername = isProfilePage ? pathParts[0] : null

    // Fetched profile user data
    const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)

    // Fetch profile user info when we detect we're on a profile page
    useEffect(() => {
        if (profileUsername && profileUsername !== session?.user?.username) {
            fetch(`/api/users/${profileUsername}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        setProfileUser({ id: data.id, displayName: data.displayName })
                    }
                })
                .catch(() => setProfileUser(null))
        } else {
            setProfileUser(null)
        }
    }, [profileUsername, session?.user?.username])
    const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [followingLoading, setFollowingLoading] = useState<string | null>(null)

    // Screen height check for responsive layout
    const [isSmallScreen, setIsSmallScreen] = useState(false)

    useEffect(() => {
        const checkHeight = () => {
            // Hide "Who to follow" if height is less than ~900px to avoid crowding
            setIsSmallScreen(window.innerHeight < 900)
        }

        checkHeight()
        window.addEventListener('resize', checkHeight)
        return () => window.removeEventListener('resize', checkHeight)
    }, [])

    // Weight chart state
    const [weightData, setWeightData] = useState<WeightChartData[]>([])
    const [weightStats, setWeightStats] = useState<{
        latest: number | null
        change: number | null
    } | null>(null)
    const [loadingWeight, setLoadingWeight] = useState(true)
    const [timePeriod, setTimePeriod] = useState<TimePeriod>("3M")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newWeight, setNewWeight] = useState("")

    const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Schedule state
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
    const [selectedDays, setSelectedDays] = useState<string[]>([])
    const [isSavingSchedule, setIsSavingSchedule] = useState(false)

    // Activity state
    const [activityData, setActivityData] = useState<ActivityData | null>(null)
    const [loadingActivity, setLoadingActivity] = useState(true)

    // Fetch suggested users from API
    const fetchSuggestedUsers = useCallback(async () => {
        try {
            const response = await fetch("/api/users/suggested")
            if (response.ok) {
                const data = await response.json()
                setSuggestedUsers(data)
            }
        } catch (error) {
            console.error("Error fetching suggested users:", error)
        } finally {
            setLoadingUsers(false)
        }
    }, [])

    // Fetch weight data
    const fetchWeightData = useCallback(async () => {
        try {
            const response = await fetch("/api/weight")
            if (response.ok) {
                const data = await response.json()
                setWeightData(data.chartData)
                setWeightStats(data.stats)
            }
        } catch (error) {
            console.error("Error fetching weight data:", error)
        } finally {
            setLoadingWeight(false)
        }
    }, [])

    // Fetch activity data
    const fetchActivityData = useCallback(async () => {
        try {
            const url = profileUser?.id ? `/api/user/activity?userId=${profileUser.id}` : "/api/user/activity"
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setActivityData(data)
            }
        } catch (error) {
            console.error("Error fetching activity data:", error)
        } finally {
            setLoadingActivity(false)
        }
    }, [profileUser?.id])

    useEffect(() => {
        if (session) {
            fetchSuggestedUsers()
            fetchWeightData()
        }
    }, [session, fetchSuggestedUsers, fetchWeightData])

    // Refetch activity when profile changes
    useEffect(() => {
        if (session) {
            setLoadingActivity(true)
            fetchActivityData()
        }
    }, [session, profileUser?.id, fetchActivityData])

    useEffect(() => {
        if (activityData?.trainingDays) {
            setSelectedDays(activityData.trainingDays)
        }
    }, [activityData])

    // Update schedule
    const handleSaveSchedule = async () => {
        setIsSavingSchedule(true)
        try {
            const response = await fetch("/api/user/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ days: selectedDays }),
            })

            if (response.ok) {
                toast({
                    title: "Horario actualizado",
                    description: "Tu constancia se calculará según estos días.",
                    variant: "success",
                })
                setIsScheduleDialogOpen(false)
                fetchActivityData()
            }
        } catch {
            toast({
                title: "Error",
                description: "No se pudo guardar el horario",
                variant: "destructive",
            })
        } finally {
            setIsSavingSchedule(false)
        }
    }

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        )
    }

    const daysOfWeek = [
        { id: "Monday", label: "Lunes" },
        { id: "Tuesday", label: "Martes" },
        { id: "Wednesday", label: "Miércoles" },
        { id: "Thursday", label: "Jueves" },
        { id: "Friday", label: "Viernes" },
        { id: "Saturday", label: "Sábado" },
        { id: "Sunday", label: "Domingo" },
    ]

    // Filter weight data by period
    const getFilteredData = () => {
        if (!weightData.length) return []
        const now = new Date()
        let cutoffDate: Date

        switch (timePeriod) {
            case "3M":
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
                break
            case "6M":
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
                break
            case "MAX":
            default:
                return weightData
        }

        return weightData.filter(d => new Date(d.date) >= cutoffDate)
    }

    // Handle add weight
    const handleAddWeight = async () => {
        const weight = parseFloat(newWeight)
        if (isNaN(weight) || weight <= 0) {
            toast({
                title: "Error",
                description: "Ingresa un peso válido",
                variant: "destructive",
            })
            return
        }

        if (!newDate) {
            toast({
                title: "Error",
                description: "Ingresa una fecha válida",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch("/api/weight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weight,
                    unit: "KG",
                    loggedAt: new Date(newDate).toISOString()
                }),
            })

            if (response.ok) {
                toast({
                    title: "¡Peso registrado!",
                    description: `${weight} kg añadido`,
                    variant: "success",
                })
                setNewWeight("")
                setNewDate(new Date().toISOString().split("T")[0])
                setIsAddDialogOpen(false)
                fetchWeightData()
            }
        } catch {
            toast({
                title: "Error",
                description: "No se pudo guardar",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle follow/unfollow
    const handleFollow = async (username: string) => {
        setFollowingLoading(username)
        try {
            const response = await fetch(`/api/users/${username}/follow`, {
                method: "POST",
            })

            if (response.ok) {
                const data = await response.json()
                setSuggestedUsers(prev =>
                    prev.map(user =>
                        user.username === username
                            ? { ...user, isFollowing: data.following }
                            : user
                    )
                )
                toast({
                    title: data.following ? "¡Siguiendo!" : "Dejaste de seguir",
                    description: data.following
                        ? `Ahora sigues a @${username}`
                        : `Ya no sigues a @${username}`,
                })
            } else {
                const error = await response.json()
                toast({
                    title: "Error",
                    description: error.error || "No se pudo completar la acción",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Follow error:", error)
            toast({
                title: "Error",
                description: "Error de conexión",
                variant: "destructive",
            })
        } finally {
            setFollowingLoading(null)
        }
    }

    const getTrendIcon = () => {
        if (!weightStats?.change) return <Minus className="w-3 h-3" />
        if (weightStats.change > 0) return <TrendingUp className="w-3 h-3 text-green-500" />
        return <TrendingDown className="w-3 h-3 text-red-500" />
    }

    if (!session) return null

    const filteredData = getFilteredData()

    return (
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 h-screen sticky top-0 p-4 gap-4">

            {/* Consitency Tracker (FIRST) */}
            <ConsistencyCard
                activityData={activityData}
                isLoading={loadingActivity}
                onOpenSettings={!profileUser ? () => setIsScheduleDialogOpen(true) : undefined}
                userName={profileUser?.displayName}
            />

            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurar Días de Entrenamiento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Selecciona los días que planeas ir al gimnasio.
                            Te recordaremos publicar tu progreso en estos días.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {daysOfWeek.map((day) => (
                                <div key={day.id} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent cursor-pointer" onClick={() => toggleDay(day.id)}>
                                    <input
                                        type="checkbox"
                                        checked={selectedDays.includes(day.id)}
                                        onChange={() => { }} // handled by parent div
                                        className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {day.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleSaveSchedule} disabled={isSavingSchedule} className="w-full">
                            {isSavingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Horario"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Weight Tracker - TradingView style (SECOND) */}
            <WeightSummaryCard userId={profileUser?.id} userName={profileUser?.displayName} />

            {/* Who to Follow - Optimized with Scroll */}
            {!isSmallScreen && (
                <Card className="bg-transparent border-0 shadow-none flex-1 min-h-0 flex flex-col">
                    <CardHeader className="pb-3 px-0 shrink-0">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="w-5 h-5 text-primary" />
                            A quién seguir
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-0 overflow-y-auto pr-1">
                        {loadingUsers ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                        ) : suggestedUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-2">
                                No hay sugerencias por ahora
                            </p>
                        ) : (
                            suggestedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between gap-2"
                                >
                                    <Link
                                        href={`/${user.username}`}
                                        className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80"
                                    >
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={user.avatarUrl || undefined} />
                                            <AvatarFallback>
                                                {getInitials(user.displayName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {user.displayName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                @{user.username}
                                            </p>
                                        </div>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant={user.isFollowing ? "outline" : "default"}
                                        className="rounded-full shrink-0"
                                        onClick={() => handleFollow(user.username)}
                                        disabled={followingLoading === user.username}
                                    >
                                        {followingLoading === user.username ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : user.isFollowing ? (
                                            "Siguiendo"
                                        ) : (
                                            "Seguir"
                                        )}
                                    </Button>
                                </div>
                            ))
                        )}
                        <Separator />
                        <Link
                            href="/search?q=&tab=users"
                            className="text-sm text-primary hover:underline"
                        >
                            Ver más
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Footer */}
            <div className="text-xs text-muted-foreground mt-auto shrink-0 py-2">
                <Link href="/terms" className="hover:underline">
                    Términos
                </Link>
                {" · "}
                <Link href="/privacy" className="hover:underline">
                    Privacidad
                </Link>
                {" · "}
                <Link href="/about" className="hover:underline">
                    Acerca de
                </Link>
                {" · "}
                <span>© 2026 FeedGym</span>
            </div>
        </aside>
    )
}
