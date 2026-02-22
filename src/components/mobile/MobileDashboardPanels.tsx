"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts"
import {
    Scale, Trophy, Loader2, Plus, TrendingUp, TrendingDown, Minus, Pencil, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import type { WeightChartData } from "@/types"

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
interface PR {
    id: string
    exercise: string
    weight: number
    unit: string
    reps: number
    notes: string | null
    achievedAt: string
}

type PanelId = "weight" | "prs"
type GoalType = "CUT" | "BULK" | "MAINTAIN" | "RECOMP"

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
function goalColor(goal: GoalType, isGaining: boolean) {
    if (goal === "CUT") return isGaining ? "#ef4444" : "#22c55e"
    if (goal === "BULK") return isGaining ? "#22c55e" : "#ef4444"
    return "#9ca3af"
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────
export function MobileDashboardPanels() {
    const { data: session } = useSession()
    const [expanded, setExpanded] = useState<PanelId | null>(null)

    // Weight state
    const [weightData, setWeightData] = useState<WeightChartData[]>([])
    const [weightStats, setWeightStats] = useState<{ latest: number | null; change: number | null } | null>(null)
    const [loadingWeight, setLoadingWeight] = useState(true)
    const [userGoal, setUserGoal] = useState<GoalType>("MAINTAIN")
    const [targetWeight, setTargetWeight] = useState<number | null>(null)
    const [isAddWeightOpen, setIsAddWeightOpen] = useState(false)
    const [newWeight, setNewWeight] = useState("")
    const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().split("T")[0])
    const [isSavingWeight, setIsSavingWeight] = useState(false)

    // PRs state
    const [prs, setPrs] = useState<PR[]>([])
    const [loadingPRs, setLoadingPRs] = useState(true)
    const [isAddPROpen, setIsAddPROpen] = useState(false)
    const [editingPR, setEditingPR] = useState<PR | null>(null)
    const [prExercise, setPrExercise] = useState("")
    const [prWeight, setPrWeight] = useState("")
    const [prReps, setPrReps] = useState("1")
    const [isSavingPR, setIsSavingPR] = useState(false)

    // ── Fetchers ──
    const fetchWeight = useCallback(async () => {
        try {
            const res = await fetch("/api/weight")
            if (res.ok) {
                const data = await res.json()
                setWeightData(data.chartData)
                setWeightStats(data.stats)
                if (data.goal) setUserGoal(data.goal)
                if (data.targetWeight !== undefined) setTargetWeight(data.targetWeight)
            }
        } catch { /* silent */ } finally { setLoadingWeight(false) }
    }, [])

    const fetchPRs = useCallback(async () => {
        try {
            const res = await fetch("/api/user/prs")
            if (res.ok) {
                const data = await res.json()
                setPrs(data.prs)
            }
        } catch { /* silent */ } finally { setLoadingPRs(false) }
    }, [])

    useEffect(() => {
        if (session) {
            fetchWeight()
            fetchPRs()
        }
    }, [session, fetchWeight, fetchPRs])

    // ── Weight submit ──
    const handleAddWeight = async () => {
        const w = parseFloat(newWeight)
        if (isNaN(w) || w <= 0) {
            toast({ title: "Error", description: "Ingresa un peso válido", variant: "destructive" })
            return
        }
        setIsSavingWeight(true)
        try {
            const res = await fetch("/api/weight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weight: w, unit: "KG", loggedAt: new Date(newWeightDate).toISOString() }),
            })
            if (res.ok) {
                toast({ title: "¡Peso registrado!", description: `${w} kg añadido`, variant: "success" })
                setNewWeight("")
                setNewWeightDate(new Date().toISOString().split("T")[0])
                setIsAddWeightOpen(false)
                fetchWeight()
            }
        } catch {
            toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" })
        } finally { setIsSavingWeight(false) }
    }

    // ── PR submit (add or edit) ──
    const handleSavePR = async () => {
        const w = parseFloat(prWeight)
        const r = parseInt(prReps)
        if (!prExercise.trim() || isNaN(w) || w <= 0) {
            toast({ title: "Error", description: "Completa ejercicio y peso", variant: "destructive" })
            return
        }
        setIsSavingPR(true)
        try {
            const res = await fetch("/api/user/prs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exercise: prExercise.trim(), weight: w, reps: isNaN(r) ? 1 : r, unit: "KG" }),
            })
            if (res.ok) {
                toast({ title: "¡PR guardado! 🏆", variant: "success" })
                setPrExercise("")
                setPrWeight("")
                setPrReps("1")
                setIsAddPROpen(false)
                setEditingPR(null)
                fetchPRs()
            }
        } catch {
            toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" })
        } finally { setIsSavingPR(false) }
    }

    const openEditPR = (pr: PR) => {
        setEditingPR(pr)
        setPrExercise(pr.exercise)
        setPrWeight(String(pr.weight))
        setPrReps(String(pr.reps))
        setIsAddPROpen(true)
    }

    const toggle = (id: PanelId) => setExpanded(prev => prev === id ? null : id)

    if (!session) return null

    // ── Derived ──
    const lastData = weightData.slice(-30)
    const isGainingOverall = lastData.length >= 2
        ? lastData[lastData.length - 1].weight > lastData[0].weight
        : false
    const lineColor = goalColor(userGoal, isGainingOverall)

    const trendEl = () => {
        if (!weightStats?.change) return <Minus className="w-3 h-3" />
        const gaining = weightStats.change > 0
        const cls = userGoal === "CUT"
            ? gaining ? "text-red-500" : "text-green-500"
            : userGoal === "BULK"
                ? gaining ? "text-green-500" : "text-red-500"
                : "text-muted-foreground"
        return gaining
            ? <TrendingUp className={`w-3 h-3 ${cls}`} />
            : <TrendingDown className={`w-3 h-3 ${cls}`} />
    }

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("es-CL", { day: "numeric", month: "short" })

    // ── Panel states ──
    const weightExpanded = expanded === "weight"
    const prsExpanded = expanded === "prs"

    return (
        <div className="px-4 pb-2">
            {/* 2-col grid — each cell collapses/expands */}
            <div className="grid grid-cols-2 gap-3">

                {/* ── WEIGHT PANEL ── */}
                <div
                    className={`transition-all duration-300 ease-in-out ${weightExpanded ? "col-span-2" : "col-span-1"}`}
                >
                    <div
                        className={`relative rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 ${weightExpanded ? "p-4" : "p-3 aspect-square flex flex-col"}`}
                        onClick={() => !weightExpanded && toggle("weight")}
                        style={{ cursor: weightExpanded ? "default" : "pointer" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <Scale className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-xs font-semibold text-foreground truncate">Mi Peso</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {weightExpanded && (
                                    <button
                                        onClick={() => setIsAddWeightOpen(true)}
                                        className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggle("weight") }}
                                    className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
                                    aria-label={weightExpanded ? "Colapsar" : "Expandir"}
                                >
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${weightExpanded ? "rotate-180" : ""}`} />
                                </button>
                            </div>
                        </div>

                        {/* Collapsed: compact stats */}
                        {!weightExpanded && (
                            <div className="flex flex-col justify-between flex-1">
                                {loadingWeight ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto mt-4" />
                                ) : (
                                    <>
                                        <div>
                                            <span className="text-3xl font-bold leading-none">
                                                {weightStats?.latest ?? "—"}
                                            </span>
                                            <span className="text-sm font-normal text-muted-foreground ml-0.5">kg</span>
                                        </div>
                                        {weightStats?.change != null && (
                                            <div className="flex items-center gap-0.5 mt-1.5">
                                                {trendEl()}
                                                <span className="text-xs text-muted-foreground">
                                                    {weightStats.change > 0 ? "+" : ""}{weightStats.change.toFixed(1)} kg
                                                </span>
                                            </div>
                                        )}
                                        <span className="text-[11px] text-muted-foreground/60 mt-auto pt-2">
                                            {userGoal === "CUT" ? "Definición" : userGoal === "BULK" ? "Volumen" : userGoal === "MAINTAIN" ? "Mantener" : "Recomp"}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Expanded: full chart */}
                        {weightExpanded && (
                            <div>
                                {/* Stats row */}
                                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                                    <span className="text-2xl font-bold">{weightStats?.latest ?? "—"} kg</span>
                                    {weightStats?.change != null && (
                                        <span className="text-sm flex items-center gap-1">
                                            {trendEl()}
                                            {weightStats.change > 0 ? "+" : ""}{weightStats.change.toFixed(1)} kg
                                        </span>
                                    )}
                                    {targetWeight && (
                                        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                            🎯 {targetWeight} kg
                                        </span>
                                    )}
                                </div>

                                {/* Chart */}
                                {loadingWeight ? (
                                    <div className="h-[150px] flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    </div>
                                ) : lastData.length === 0 ? (
                                    <div className="h-[150px] flex items-center justify-center text-sm text-muted-foreground">
                                        Sin datos. ¡Añade tu peso!
                                    </div>
                                ) : (
                                    <div className="h-[160px] w-full mt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={lastData} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={v => {
                                                        const d = new Date(v)
                                                        return `${d.getDate()}/${d.getMonth() + 1}`
                                                    }}
                                                    interval="preserveStartEnd"
                                                />
                                                <YAxis
                                                    domain={["dataMin - 1", "dataMax + 1"]}
                                                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={v => v.toFixed(1)}
                                                    width={32}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "hsl(var(--card))",
                                                        border: "1px solid hsl(var(--border))",
                                                        borderRadius: "8px",
                                                        fontSize: "12px",
                                                    }}
                                                    formatter={(v: number) => [`${v} kg`, "Peso"]}
                                                    labelFormatter={l => new Date(l).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="weight"
                                                    stroke={lineColor}
                                                    strokeWidth={2}
                                                    dot={(props: any) => {
                                                        const { cx, cy, index } = props
                                                        if (index === 0 || !lastData[index - 1]) {
                                                            return <circle key={`dot-${index}`} cx={cx} cy={cy} r={3} fill={lineColor} stroke="#000" strokeWidth={1.5} />
                                                        }
                                                        const prev = lastData[index - 1].weight
                                                        const curr = lastData[index].weight
                                                        const c = goalColor(userGoal, curr > prev)
                                                        return <circle key={`dot-${index}`} cx={cx} cy={cy} r={3} fill={c} stroke="#000" strokeWidth={1.5} />
                                                    }}
                                                    activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "#000", strokeWidth: 2 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── PRs PANEL ── */}
                <div
                    className={`transition-all duration-300 ease-in-out ${prsExpanded ? "col-span-2" : "col-span-1"}`}
                >
                    <div
                        className={`relative rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 ${prsExpanded ? "p-4" : "p-3 aspect-square flex flex-col"}`}
                        onClick={() => !prsExpanded && toggle("prs")}
                        style={{ cursor: prsExpanded ? "default" : "pointer" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                                <span className="text-xs font-semibold text-foreground">PRs</span>
                                {prs.length > 0 && (
                                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 rounded-full">
                                        {prs.length}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {prsExpanded && (
                                    <button
                                        onClick={() => { setPrExercise(""); setPrWeight(""); setPrReps("1"); setEditingPR(null); setIsAddPROpen(true) }}
                                        className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggle("prs") }}
                                    className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
                                    aria-label={prsExpanded ? "Colapsar" : "Expandir"}
                                >
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${prsExpanded ? "rotate-180" : ""}`} />
                                </button>
                            </div>
                        </div>

                        {/* Collapsed: top PR preview */}
                        {!prsExpanded && (
                            <div className="flex flex-col justify-between flex-1">
                                {loadingPRs ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-amber-500 mx-auto mt-4" />
                                ) : prs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center flex-1 gap-1">
                                        <span className="text-3xl">🏆</span>
                                        <span className="text-[11px] text-muted-foreground text-center">Sin PRs</span>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-[11px] text-muted-foreground truncate mb-0.5">{prs[0].exercise}</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-bold leading-none">{prs[0].weight}</span>
                                                <span className="text-sm text-muted-foreground">kg</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">x{prs[0].reps}</p>
                                        </div>
                                        <p className="text-[10px] text-amber-500/70 mt-auto pt-2">{prs.length} record{prs.length !== 1 ? "s" : ""}</p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Expanded: full PR list with edit button */}
                        {prsExpanded && (
                            <div>
                                {loadingPRs ? (
                                    <div className="flex justify-center py-6">
                                        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                                    </div>
                                ) : prs.length === 0 ? (
                                    <div className="flex flex-col items-center py-6 gap-3">
                                        <span className="text-4xl">🏆</span>
                                        <p className="text-sm text-muted-foreground text-center">
                                            Sin PRs registrados aún.<br />¡Añade tu primero!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                                        {prs.map((pr, idx) => (
                                            <div
                                                key={pr.id}
                                                className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2.5"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-[11px] font-bold text-amber-500/80 w-4 text-center shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{pr.exercise}</p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            x{pr.reps} · {formatDate(pr.achievedAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    <span className="text-sm font-bold">
                                                        {pr.weight}<span className="text-xs text-muted-foreground">kg</span>
                                                    </span>
                                                    <button
                                                        onClick={() => openEditPR(pr)}
                                                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                                        aria-label="Editar PR"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Add Weight Dialog ── */}
            <Dialog open={isAddWeightOpen} onOpenChange={setIsAddWeightOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-primary" />
                            Registrar Peso
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <Input
                            type="number"
                            step="0.1"
                            placeholder="Peso (kg)"
                            value={newWeight}
                            onChange={e => setNewWeight(e.target.value)}
                            autoFocus
                        />
                        <Input
                            type="date"
                            value={newWeightDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={e => setNewWeightDate(e.target.value)}
                        />
                        <Button onClick={handleAddWeight} disabled={isSavingWeight} className="w-full">
                            {isSavingWeight ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Peso"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Add / Edit PR Dialog ── */}
            <Dialog open={isAddPROpen} onOpenChange={o => { setIsAddPROpen(o); if (!o) setEditingPR(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            {editingPR ? "Editar PR" : "Nuevo Personal Record"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Ejercicio</label>
                            <Input
                                value={prExercise}
                                onChange={e => setPrExercise(e.target.value)}
                                placeholder="Ej: Bench Press, Squat..."
                                autoFocus
                                readOnly={!!editingPR}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Peso (kg)</label>
                                <Input
                                    type="number"
                                    value={prWeight}
                                    onChange={e => setPrWeight(e.target.value)}
                                    placeholder="100"
                                    min="0"
                                    step="0.5"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Reps</label>
                                <Input
                                    type="number"
                                    value={prReps}
                                    onChange={e => setPrReps(e.target.value)}
                                    placeholder="1"
                                    min="1"
                                />
                            </div>
                        </div>
                        <Button onClick={handleSavePR} disabled={isSavingPR} className="w-full">
                            {isSavingPR ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingPR ? "Actualizar PR 🏆" : "Guardar PR 🏆")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
