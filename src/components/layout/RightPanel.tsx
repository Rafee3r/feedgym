"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
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

interface SuggestedUser {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isFollowing: boolean
}

type TimePeriod = "1M" | "6M" | "MAX"

export function RightPanel() {
    const { data: session } = useSession()
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
    const [timePeriod, setTimePeriod] = useState<TimePeriod>("1M")
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
            const response = await fetch("/api/user/activity")
            if (response.ok) {
                const data = await response.json()
                setActivityData(data)
            }
        } catch (error) {
            console.error("Error fetching activity data:", error)
        } finally {
            setLoadingActivity(false)
        }
    }, [])

    useEffect(() => {
        if (session) {
            fetchSuggestedUsers()
            fetchWeightData()
            fetchActivityData()
        }
    }, [session, fetchSuggestedUsers, fetchWeightData, fetchActivityData])

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
        { id: "1", label: "Lunes" },
        { id: "2", label: "Martes" },
        { id: "3", label: "Miércoles" },
        { id: "4", label: "Jueves" },
        { id: "5", label: "Viernes" },
        { id: "6", label: "Sábado" },
        { id: "0", label: "Domingo" },
    ]

    // Filter weight data by period
    const getFilteredData = () => {
        if (!weightData.length) return []
        const now = new Date()
        let cutoffDate: Date

        switch (timePeriod) {
            case "1M":
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
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
                onOpenSettings={() => setIsScheduleDialogOpen(true)}
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
            <Card className="bg-transparent border-0 shadow-none shrink-0">
                <CardHeader className="pb-2 px-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Scale className="w-5 h-5 text-primary" />
                            Mi Peso
                        </CardTitle>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Registrar Peso</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="Peso (kg)"
                                        value={newWeight}
                                        onChange={(e) => setNewWeight(e.target.value)}
                                    />
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                value={newDate}
                                                max={new Date().toISOString().split("T")[0]}
                                                onChange={(e) => setNewDate(e.target.value)}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleAddWeight}
                                        disabled={isSubmitting}
                                        className="w-full"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Guardar"
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Period Selector - TradingView style */}
                    <div className="flex gap-1 mt-2">
                        {(["1M", "6M", "MAX"] as TimePeriod[]).map((period) => (
                            <button
                                key={period}
                                onClick={() => setTimePeriod(period)}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${timePeriod === period
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent"
                                    }`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="pt-0 px-0">
                    {loadingWeight ? (
                        <div className="h-[120px] flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground">
                            Sin datos. ¡Añade tu peso!
                        </div>
                    ) : (
                        <>
                            {/* Current stats */}
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-2xl font-bold">
                                    {weightStats?.latest ?? "—"} kg
                                </span>
                                {weightStats?.change && (
                                    <span className={`text-sm flex items-center gap-1 ${weightStats.change > 0 ? "text-green-500" : "text-red-500"
                                        }`}>
                                        {getTrendIcon()}
                                        {weightStats.change > 0 ? "+" : ""}
                                        {weightStats.change.toFixed(1)} kg
                                    </span>
                                )}
                            </div>

                            {/* Chart */}
                            <div className="h-[200px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={true}
                                            horizontal={true}
                                            stroke="hsl(var(--border))"
                                            opacity={0.3}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => {
                                                const date = new Date(value)
                                                return `${date.getDate()}/${date.getMonth() + 1}`
                                            }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            domain={["dataMin - 1", "dataMax + 1"]}
                                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => value.toFixed(1)}
                                            width={35}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                            }}
                                            itemStyle={{ color: "hsl(var(--foreground))" }}
                                            formatter={(value: number) => [`${value} kg`, "Peso"]}
                                            labelFormatter={(label) => {
                                                const date = new Date(label)
                                                return date.toLocaleDateString("es-ES", {
                                                    day: "numeric",
                                                    month: "long",
                                                })
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#22c55e"
                                            strokeWidth={2}
                                            dot={{ fill: "#22c55e", strokeWidth: 2, r: 4, stroke: "#000" }}
                                            activeDot={{ r: 6, fill: "#22c55e", stroke: "#000", strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

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
