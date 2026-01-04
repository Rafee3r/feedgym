"use client"

import { useState, useEffect } from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { Plus, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import type { WeightChartData } from "@/types"

export function WeightChart() {
    const [chartData, setChartData] = useState<WeightChartData[]>([])
    const [stats, setStats] = useState<{
        latest: number | null
        change: number | null
        count: number
    } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newWeight, setNewWeight] = useState("")

    const fetchData = async () => {
        try {
            const response = await fetch("/api/weight")
            if (response.ok) {
                const data = await response.json()
                setChartData(data.chartData)
                setStats(data.stats)
            }
        } catch (err) {
            console.error("Error fetching weight data:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

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

        setIsSubmitting(true)
        try {
            const response = await fetch("/api/weight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weight, unit: "KG" }),
            })

            if (response.ok) {
                toast({
                    title: "¡Peso registrado!",
                    description: `${weight} kg añadido a tu historial`,
                    variant: "success",
                })
                setNewWeight("")
                setIsDialogOpen(false)
                fetchData()
            } else {
                throw new Error("Error al guardar")
            }
        } catch {
            toast({
                title: "Error",
                description: "No se pudo guardar el peso",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    const getTrendIcon = () => {
        if (!stats?.change) return <Minus className="w-4 h-4" />
        if (stats.change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
        return <TrendingDown className="w-4 h-4 text-red-500" />
    }

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Peso Actual
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.latest ? `${stats.latest} kg` : "—"}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Cambio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-2xl font-bold">
                            {getTrendIcon()}
                            {stats?.change
                                ? `${stats.change > 0 ? "+" : ""}${stats.change.toFixed(1)} kg`
                                : "—"}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2 sm:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Registros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.count || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Evolución de Peso</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="rounded-full">
                                <Plus className="w-4 h-4 mr-1" />
                                Añadir
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Registrar Peso</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Peso (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        step="0.1"
                                        placeholder="75.5"
                                        value={newWeight}
                                        onChange={(e) => setNewWeight(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={handleAddWeight}
                                    disabled={isSubmitting}
                                    className="w-full"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        "Guardar"
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {chartData.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            <p>No hay datos todavía. Añade tu primer registro.</p>
                        </div>
                    ) : (
                        <div className="h-[250px] sm:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => {
                                            const date = new Date(value)
                                            return `${date.getDate()}/${date.getMonth() + 1}`
                                        }}
                                        className="text-muted-foreground"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        domain={["dataMin - 2", "dataMax + 2"]}
                                        className="text-muted-foreground"
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--background))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                        formatter={(value: number) => [`${value} kg`, "Peso"]}
                                        labelFormatter={(label) => {
                                            const date = new Date(label)
                                            return date.toLocaleDateString("es-ES", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                                        activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
