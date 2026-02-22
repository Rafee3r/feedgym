"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { ConsistencyCard, type ActivityData } from "@/components/consistency/ConsistencyCard"
import { WeightSummaryCard } from "@/components/dashboard/WeightSummaryCard"
import { PRsCard } from "@/components/dashboard/PRsCard"
import { WeeklyReportCard } from "@/components/dashboard/WeeklyReportCard"

interface ProfileUser {
    id: string
    displayName: string
}

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






    // Schedule state
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
    const [selectedDays, setSelectedDays] = useState<string[]>([])
    const [isSavingSchedule, setIsSavingSchedule] = useState(false)

    // Activity state
    const [activityData, setActivityData] = useState<ActivityData | null>(null)
    const [loadingActivity, setLoadingActivity] = useState(true)

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

    if (!session) return null

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

            {/* PRs Actuales */}
            <PRsCard />

            {/* Reporte Semanal IA */}
            <WeeklyReportCard />

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
