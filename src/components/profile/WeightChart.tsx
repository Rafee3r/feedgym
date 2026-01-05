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
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Minus,
    Loader2,
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { WeightChartData, WeightLogData } from "@/types"

type TimeRange = "3M" | "6M" | "MAX"

export function WeightChart() {
    const [chartData, setChartData] = useState<WeightChartData[]>([])
    const [logs, setLogs] = useState<WeightLogData[]>([])
    const [stats, setStats] = useState<{
        latest: number | null
        change: number | null
        count: number
    } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [timeRange, setTimeRange] = useState<TimeRange>("3M")

    // Dialog & Form States
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingLog, setEditingLog] = useState<WeightLogData | null>(null)
    const [formData, setFormData] = useState({
        weight: "",
        date: "",
        notes: "",
    })

    const fetchData = async () => {
        setIsLoading(true)
        try {
            // Determine limit based on timeRange
            // 3M = ~90 days, 6M = ~180 days, MAX = 1000
            let limit = "90"
            if (timeRange === "6M") limit = "180"
            if (timeRange === "MAX") limit = "1000"

            const response = await fetch(`/api/weight?limit=${limit}`)
            if (response.ok) {
                const data = await response.json()
                setChartData(data.chartData)
                setLogs(data.logs)
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
    }, [timeRange])

    const handleOpenDialog = (log?: WeightLogData) => {
        if (log) {
            setEditingLog(log)
            setFormData({
                weight: log.weight.toString(),
                date: new Date(log.loggedAt).toISOString().split("T")[0],
                notes: log.notes || "",
            })
        } else {
            setEditingLog(null)
            setFormData({
                weight: "",
                date: new Date().toISOString().split("T")[0],
                notes: "",
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        const weight = parseFloat(formData.weight)
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
            const url = editingLog ? `/api/weight/${editingLog.id}` : "/api/weight"
            const method = editingLog ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weight,
                    unit: "KG",
                    date: formData.date ? new Date(formData.date).toISOString() : undefined,
                    notes: formData.notes || null,
                }),
            })

            if (response.ok) {
                toast({
                    title: editingLog ? "Actualizado" : "Registrado",
                    description: editingLog
                        ? "Registro de peso actualizado"
                        : `${weight} kg añadido a tu historial`,
                    variant: "success",
                })
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

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este registro?")) return

        try {
            const response = await fetch(`/api/weight/${id}`, {
                method: "DELETE",
            })

            if (response.ok) {
                toast({
                    title: "Eliminado",
                    description: "Registro eliminado correctamente",
                })
                fetchData()
            } else {
                throw new Error("Error al eliminar")
            }
        } catch {
            toast({
                title: "Error",
                description: "No se pudo eliminar el registro",
                variant: "destructive",
            })
        }
    }

    const getTrendIcon = () => {
        if (!stats?.change) return <Minus className="w-4 h-4" />
        if (stats.change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
        return <TrendingDown className="w-4 h-4 text-red-500" />
    }

    if (isLoading && chartData.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
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
                            Cambio ({timeRange})
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
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle>Evolución de Peso</CardTitle>
                        <div className="flex items-center gap-1">
                            {(["3M", "6M", "MAX"] as TimeRange[]).map((range) => (
                                <Button
                                    key={range}
                                    variant={timeRange === range ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setTimeRange(range)}
                                    className="h-7 text-xs"
                                >
                                    {range}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="rounded-full" onClick={() => handleOpenDialog()}>
                                <Plus className="w-4 h-4 mr-1" />
                                Añadir
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingLog ? "Editar Peso" : "Registrar Peso"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Peso (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        step="0.1"
                                        placeholder="75.5"
                                        value={formData.weight}
                                        onChange={(e) =>
                                            setFormData({ ...formData, weight: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Fecha</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, date: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notas (Opcional)</Label>
                                    <Input
                                        id="notes"
                                        placeholder="Ej: Después de entrenar"
                                        value={formData.notes}
                                        onChange={(e) =>
                                            setFormData({ ...formData, notes: e.target.value })
                                        }
                                    />
                                </div>
                                <Button
                                    onClick={handleSubmit}
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
                            <p>No hay datos disponibles en este periodo.</p>
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

            {/* History List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Historial</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-lg transition-colors group"
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold">{log.weight} kg</span>
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(log.loggedAt), "d MMM yyyy", { locale: es })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {log.notes && (
                                        <span className="text-xs text-muted-foreground hidden sm:inline-block max-w-[150px] truncate">
                                            {log.notes}
                                        </span>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOpenDialog(log)}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(log.id)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                                No hay registros en este periodo.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
