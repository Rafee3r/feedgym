"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Trophy, Plus, Loader2, Dumbbell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

interface PR {
    id: string
    exercise: string
    weight: number
    unit: string
    reps: number
    notes: string | null
    achievedAt: string
}

interface PRsCardProps {
    compact?: boolean
    className?: string
}

export function PRsCard({ compact = false, className }: PRsCardProps) {
    const { data: session } = useSession()
    const [prs, setPrs] = useState<PR[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [exercise, setExercise] = useState("")
    const [weight, setWeight] = useState("")
    const [reps, setReps] = useState("1")

    const fetchPRs = useCallback(async () => {
        try {
            const res = await fetch("/api/user/prs")
            if (res.ok) {
                const data = await res.json()
                setPrs(data.prs)
            }
        } catch {
            console.error("Error fetching PRs")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (session) fetchPRs()
    }, [session, fetchPRs])

    const handleAdd = async () => {
        const w = parseFloat(weight)
        const r = parseInt(reps)
        if (!exercise.trim() || isNaN(w) || w <= 0) {
            toast({ title: "Error", description: "Completa ejercicio y peso", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/user/prs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exercise: exercise.trim(), weight: w, reps: isNaN(r) ? 1 : r, unit: "KG" }),
            })
            if (res.ok) {
                toast({ title: "¡PR registrado! 🏆", description: `${exercise.trim()} — ${w}kg`, variant: "success" })
                setExercise("")
                setWeight("")
                setReps("1")
                setIsAddOpen(false)
                fetchPRs()
            }
        } catch {
            toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("es-CL", { day: "numeric", month: "short" })
    }

    if (!session) return null

    // ── Compact mode (mobile) ──
    if (compact) {
        return (
            <div className={`shrink-0 ${className ?? ""}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-foreground">PRs Actuales</span>
                        {prs.length > 0 && (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full ml-1">
                                {prs.length}
                            </span>
                        )}
                    </div>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-amber-500"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-3">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    </div>
                ) : prs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                        Aún no tienes PRs. ¡Registra tu primero!
                    </p>
                ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {prs.slice(0, 5).map((pr) => (
                            <div
                                key={pr.id}
                                className="shrink-0 bg-card/50 border border-border/50 rounded-lg px-3 py-2 min-w-[110px]"
                            >
                                <p className="text-[10px] text-muted-foreground truncate">{pr.exercise}</p>
                                <p className="text-sm font-bold text-foreground">
                                    {pr.weight}<span className="text-[10px] text-muted-foreground">kg</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    x{pr.reps} · {formatDate(pr.achievedAt)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add PR Dialog */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                Nuevo Personal Record
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Ejercicio</label>
                                <Input
                                    value={exercise}
                                    onChange={(e) => setExercise(e.target.value)}
                                    placeholder="Ej: Bench Press, Squat..."
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Peso (kg)</label>
                                    <Input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        placeholder="100"
                                        min="0"
                                        step="0.5"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Reps</label>
                                    <Input
                                        type="number"
                                        value={reps}
                                        onChange={(e) => setReps(e.target.value)}
                                        placeholder="1"
                                        min="1"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleAdd} disabled={isSubmitting} className="w-full">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar PR 🏆"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    // ── Full mode (desktop sidebar) ──
    return (
        <Card className={`bg-transparent border-0 shadow-none shrink-0 ${className ?? ""}`}>
            <CardHeader className="pb-2 px-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        PRs Actuales
                    </CardTitle>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-amber-500"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-0 pt-0">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    </div>
                ) : prs.length === 0 ? (
                    <div className="flex flex-col items-center py-4 gap-2">
                        <Dumbbell className="w-8 h-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground text-center">
                            Sin PRs registrados aún
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setIsAddOpen(true)}
                        >
                            <Plus className="w-3 h-3 mr-1" /> Añadir PR
                        </Button>
                    </div>
                ) : (
                    <div className="bg-card/50 rounded-xl border border-border/50 divide-y divide-border/50">
                        {prs.slice(0, 6).map((pr, idx) => (
                            <div key={pr.id} className="flex items-center justify-between px-3 py-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-xs font-bold text-amber-500/80 w-4 text-center shrink-0">
                                        {idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{pr.exercise}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            x{pr.reps} · {formatDate(pr.achievedAt)}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-foreground shrink-0 ml-2">
                                    {pr.weight}<span className="text-xs text-muted-foreground">kg</span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Add PR Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            Nuevo Personal Record
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Ejercicio</label>
                            <Input
                                value={exercise}
                                onChange={(e) => setExercise(e.target.value)}
                                placeholder="Ej: Bench Press, Squat..."
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Peso (kg)</label>
                                <Input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="100"
                                    min="0"
                                    step="0.5"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Reps</label>
                                <Input
                                    type="number"
                                    value={reps}
                                    onChange={(e) => setReps(e.target.value)}
                                    placeholder="1"
                                    min="1"
                                />
                            </div>
                        </div>
                        <Button onClick={handleAdd} disabled={isSubmitting} className="w-full">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar PR 🏆"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
