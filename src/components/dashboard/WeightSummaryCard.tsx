"use client"

import { useState, useCallback, useEffect } from "react"
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
import { Scale, Loader2, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import type { WeightChartData } from "@/types"

type TimePeriod = "3M" | "6M" | "MAX"

interface WeightSummaryCardProps {
    className?: string
    userId?: string
    userName?: string
    showAddButton?: boolean
}

export function WeightSummaryCard({ className, userId, userName, showAddButton = true }: WeightSummaryCardProps) {
    const { data: session } = useSession()

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
    const [userGoal, setUserGoal] = useState<"CUT" | "BULK" | "MAINTAIN" | "RECOMP">("MAINTAIN")

    const isOwnProfile = !userId || userId === session?.user?.id

    // Fetch weight data
    const fetchWeightData = useCallback(async () => {
        try {
            const url = userId ? `/api/weight?userId=${userId}` : "/api/weight"
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setWeightData(data.chartData)
                setWeightStats(data.stats)
                if (data.goal) {
                    setUserGoal(data.goal)
                }
            }
        } catch (error) {
            console.error("Error fetching weight data:", error)
        } finally {
            setLoadingWeight(false)
        }
    }, [userId])

    useEffect(() => {
        if (session) {
            setLoadingWeight(true)
            fetchWeightData()
        }
    }, [session, userId, fetchWeightData])

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

    const getTrendIcon = () => {
        if (!weightStats?.change) return <Minus className="w-3 h-3" />

        const isGainingWeight = weightStats.change > 0
        let colorClass = "text-yellow-500"

        if (userGoal === "CUT") {
            colorClass = isGainingWeight ? "text-red-500" : "text-green-500"
        } else if (userGoal === "BULK") {
            colorClass = isGainingWeight ? "text-green-500" : "text-red-500"
        }

        if (isGainingWeight) {
            return <TrendingUp className={`w-3 h-3 ${colorClass}`} />
        }
        return <TrendingDown className={`w-3 h-3 ${colorClass}`} />
    }

    if (!session) return null

    const filteredData = getFilteredData()

    return (
        <Card className={`bg-transparent border-0 shadow-none shrink-0 ${className}`}>
            <CardHeader className="pb-2 px-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Scale className="w-5 h-5 text-primary" />
                        {userName ? `Peso de ${userName}` : "Mi Peso"}
                    </CardTitle>
                    {showAddButton && isOwnProfile && (
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
                    )}
                </div>

                {/* Period Selector - TradingView style */}
                <div className="flex gap-1 mt-2">
                    {(["3M", "6M", "MAX"] as TimePeriod[]).map((period) => (
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
                        {isOwnProfile ? "Sin datos. ¡Añade tu peso!" : "No hay datos de este usuario"}
                    </div>
                ) : (
                    <>
                        {/* Current stats */}
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-bold">
                                {weightStats?.latest ?? "—"} kg
                            </span>
                            {weightStats?.change && (() => {
                                const isGaining = weightStats.change > 0
                                let colorClass = "text-yellow-500"
                                if (userGoal === "CUT") {
                                    colorClass = isGaining ? "text-red-500" : "text-green-500"
                                } else if (userGoal === "BULK") {
                                    colorClass = isGaining ? "text-green-500" : "text-red-500"
                                }
                                return (
                                    <span className={`text-sm flex items-center gap-1 ${colorClass}`}>
                                        {getTrendIcon()}
                                        {weightStats.change > 0 ? "+" : ""}
                                        {weightStats.change.toFixed(1)} kg
                                    </span>
                                )
                            })()}
                        </div>

                        {/* Chart - Multicolor based on goal */}
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
                                    {/* Render individual line segments with colors */}
                                    {filteredData.map((point, index) => {
                                        if (index === 0) return null
                                        const prevWeight = filteredData[index - 1].weight
                                        const currWeight = point.weight
                                        const isGaining = currWeight > prevWeight
                                        const isLosing = currWeight < prevWeight

                                        let color = "#9ca3af" // Gray for neutral
                                        if (userGoal === "CUT") {
                                            if (isLosing) color = "#22c55e" // Green - good
                                            else if (isGaining) color = "#ef4444" // Red - bad
                                        } else if (userGoal === "BULK") {
                                            if (isGaining) color = "#22c55e" // Green - good
                                            else if (isLosing) color = "#ef4444" // Red - bad
                                        }

                                        const segmentData = [
                                            filteredData[index - 1],
                                            point
                                        ]

                                        return (
                                            <Line
                                                key={`segment-${index}`}
                                                data={segmentData}
                                                type="monotone"
                                                dataKey="weight"
                                                stroke={color}
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={false}
                                                isAnimationActive={false}
                                            />
                                        )
                                    })}
                                    {/* Render dots on top */}
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="transparent"
                                        strokeWidth={0}
                                        dot={(props: any) => {
                                            const { cx, cy, index } = props
                                            if (index === 0 || !filteredData[index - 1]) {
                                                return <circle cx={cx} cy={cy} r={4} fill="#9ca3af" stroke="#000" strokeWidth={2} />
                                            }
                                            const prevWeight = filteredData[index - 1].weight
                                            const currWeight = filteredData[index].weight
                                            const isGaining = currWeight > prevWeight
                                            const isLosing = currWeight < prevWeight

                                            let color = "#9ca3af"
                                            if (userGoal === "CUT") {
                                                if (isLosing) color = "#22c55e"
                                                else if (isGaining) color = "#ef4444"
                                            } else if (userGoal === "BULK") {
                                                if (isGaining) color = "#22c55e"
                                                else if (isLosing) color = "#ef4444"
                                            }

                                            return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#000" strokeWidth={2} />
                                        }}
                                        activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "#000", strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
