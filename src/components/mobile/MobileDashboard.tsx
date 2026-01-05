"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ConsistencyCard, type ActivityData } from "@/components/consistency/ConsistencyCard"
import { WeightSummaryCard } from "@/components/dashboard/WeightSummaryCard"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function MobileDashboard() {
    const { data: session } = useSession()

    // Consistency state
    const [activityData, setActivityData] = useState<ActivityData | null>(null)
    const [loadingActivity, setLoadingActivity] = useState(true)
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
    const [selectedDays, setSelectedDays] = useState<string[]>([])
    const [isSavingSchedule, setIsSavingSchedule] = useState(false)

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
            fetchActivityData()
        }
    }, [session, fetchActivityData])

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

    if (!session) return null

    return (
        <div className="block lg:hidden space-y-4 px-4 pb-4">

            <ConsistencyCard
                activityData={activityData}
                isLoading={loadingActivity}
                onOpenSettings={() => setIsScheduleDialogOpen(true)}
                className="bg-transparent"
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

            <WeightSummaryCard />
        </div>
    )
}
