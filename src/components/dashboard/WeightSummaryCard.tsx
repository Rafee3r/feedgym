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

export function WeightSummaryCard({ className }: { className?: string }) {
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

    useEffect(() => {
        if (session) {
            fetchWeightData()
        }
    }, [session, fetchWeightData])

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
        if (weightStats.change > 0) return <TrendingUp className="w-3 h-3 text-green-500" />
        return <TrendingDown className="w-3 h-3 text-red-500" />
    }

    if (!session) return null

    const filteredData = getFilteredData()

    return (
        <Card className={`bg-transparent border-0 shadow-none shrink-0 ${className}`}>
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
    )
}
