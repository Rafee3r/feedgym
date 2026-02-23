"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
    ChevronDown,
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Dumbbell,
    X,
    GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RoutineExercise {
    id?: string
    exercise: string
    weight?: number | null
    sets: number
    reps: number
    order: number
}

interface Routine {
    id: string
    name: string
    dayOfWeek: string
    order: number
    exercises: RoutineExercise[]
}

const DAY_LABELS: Record<string, string> = {
    Monday: "Lunes",
    Tuesday: "Martes",
    Wednesday: "Miércoles",
    Thursday: "Jueves",
    Friday: "Viernes",
    Saturday: "Sábado",
    Sunday: "Domingo",
}

export function RoutinesCard({ compact = false }: { compact?: boolean }) {
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)
    const [routines, setRoutines] = useState<Routine[]>([])
    const [trainingDays, setTrainingDays] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Editor state
    const [editorName, setEditorName] = useState("")
    const [editorDay, setEditorDay] = useState("")
    const [editorExercises, setEditorExercises] = useState<RoutineExercise[]>([])

    const fetchRoutines = useCallback(async () => {
        if (!session?.user) return
        try {
            const res = await fetch("/api/user/routines")
            if (res.ok) {
                const data = await res.json()
                setRoutines(data.routines ?? data)
                if (data.trainingDays) setTrainingDays(data.trainingDays)
            }
        } catch {
            // silently fail
        } finally {
            setIsLoading(false)
        }
    }, [session?.user])

    useEffect(() => {
        fetchRoutines()
    }, [fetchRoutines])

    const openEditor = (routine?: Routine, day?: string) => {
        if (routine) {
            setEditingRoutine(routine)
            setEditorName(routine.name)
            setEditorDay(routine.dayOfWeek)
            setEditorExercises(
                routine.exercises.map((ex, i) => ({
                    exercise: ex.exercise,
                    weight: ex.weight,
                    sets: ex.sets,
                    reps: ex.reps,
                    order: ex.order ?? i,
                }))
            )
        } else {
            setEditingRoutine(null)
            setEditorName("")
            setEditorDay(day || trainingDays[0] || "Monday")
            setEditorExercises([
                { exercise: "", weight: null, sets: 3, reps: 10, order: 0 },
            ])
        }
        setIsEditorOpen(true)
    }

    const addExercise = () => {
        setEditorExercises((prev) => [
            ...prev,
            { exercise: "", weight: null, sets: 3, reps: 10, order: prev.length },
        ])
    }

    const removeExercise = (index: number) => {
        setEditorExercises((prev) => prev.filter((_, i) => i !== index))
    }

    const updateExercise = (index: number, field: string, value: string | number | null) => {
        setEditorExercises((prev) =>
            prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
        )
    }

    const saveRoutine = async () => {
        if (!editorName.trim() || !editorDay) return
        setIsSaving(true)

        try {
            const body = {
                id: editingRoutine?.id,
                name: editorName.trim(),
                dayOfWeek: editorDay,
                exercises: editorExercises
                    .filter((ex) => ex.exercise.trim())
                    .map((ex, i) => ({
                        exercise: ex.exercise.trim(),
                        weight: ex.weight || undefined,
                        sets: ex.sets,
                        reps: ex.reps,
                        order: i,
                    })),
            }

            const res = await fetch("/api/user/routines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                await fetchRoutines()
                setIsEditorOpen(false)
            }
        } catch {
            // silently fail
        } finally {
            setIsSaving(false)
        }
    }

    const deleteRoutine = async (id: string) => {
        try {
            const res = await fetch(`/api/user/routines?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                setRoutines((prev) => prev.filter((r) => r.id !== id))
            }
        } catch {
            // silently fail
        }
    }

    // Group routines by day
    const routinesByDay = trainingDays.reduce<Record<string, Routine | undefined>>((acc, day) => {
        acc[day] = routines.find((r) => r.dayOfWeek === day)
        return acc
    }, {})

    if (!compact) return null

    return (
        <>
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                {/* Header - toggle */}
                <button
                    className="flex items-center justify-between w-full px-4 py-3"
                    onClick={() => setIsOpen((o) => !o)}
                    aria-expanded={isOpen}
                >
                    <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Rutinas</span>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            {routines.length}
                        </span>
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                            }`}
                    />
                </button>

                {/* Content */}
                {isOpen && (
                    <div className="px-4 pb-4 border-t border-border/30">
                        {isLoading ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                        ) : trainingDays.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">
                                Configura tus días de entrenamiento en Constancia primero.
                            </p>
                        ) : (
                            <div className="space-y-3 pt-3">
                                {trainingDays.map((day) => {
                                    const routine = routinesByDay[day]
                                    return (
                                        <div key={day} className="group">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-primary/80 bg-primary/5 px-2 py-0.5 rounded">
                                                        {DAY_LABELS[day] || day}
                                                    </span>
                                                    {routine && (
                                                        <span className="text-xs font-medium text-foreground">
                                                            {routine.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {routine ? (
                                                        <>
                                                            <button
                                                                onClick={() => openEditor(routine)}
                                                                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteRoutine(routine.id)}
                                                                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => openEditor(undefined, day)}
                                                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {routine && routine.exercises.length > 0 ? (
                                                <div className="space-y-0.5 ml-1">
                                                    {routine.exercises.map((ex, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center gap-2 text-[12px] leading-relaxed"
                                                        >
                                                            <span className="text-muted-foreground/50 font-mono w-4 text-right shrink-0">
                                                                {i + 1}
                                                            </span>
                                                            <span className="text-foreground font-medium flex-1">
                                                                {ex.exercise}
                                                            </span>
                                                            <span className="text-muted-foreground shrink-0 tabular-nums">
                                                                {ex.weight ? `(${ex.weight}) ` : ""}
                                                                {ex.sets} × {ex.reps}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : !routine ? (
                                                <button
                                                    onClick={() => openEditor(undefined, day)}
                                                    className="w-full py-2 text-xs text-muted-foreground/60 hover:text-primary border border-dashed border-border/40 rounded-lg hover:border-primary/30 transition-colors"
                                                >
                                                    + Agregar rutina
                                                </button>
                                            ) : null}

                                            {day !== trainingDays[trainingDays.length - 1] && (
                                                <div className="border-b border-border/20 mt-3" />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Routine Editor Dialog */}
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRoutine ? "Editar Rutina" : "Nueva Rutina"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs mb-1.5">Nombre</Label>
                                <Input
                                    value={editorName}
                                    onChange={(e) => setEditorName(e.target.value)}
                                    placeholder="Ej: Piernas"
                                    className="text-sm"
                                />
                            </div>
                            <div>
                                <Label className="text-xs mb-1.5">Día</Label>
                                <select
                                    value={editorDay}
                                    onChange={(e) => setEditorDay(e.target.value)}
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    {trainingDays.map((d) => (
                                        <option key={d} value={d}>
                                            {DAY_LABELS[d] || d}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Exercises list */}
                        <div className="space-y-2">
                            <Label className="text-xs">Ejercicios</Label>
                            {editorExercises.map((ex, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <GripVertical className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                                    <Input
                                        value={ex.exercise}
                                        onChange={(e) => updateExercise(i, "exercise", e.target.value)}
                                        placeholder="Ejercicio"
                                        className="text-xs h-8 flex-1"
                                    />
                                    <Input
                                        type="number"
                                        value={ex.weight ?? ""}
                                        onChange={(e) =>
                                            updateExercise(
                                                i,
                                                "weight",
                                                e.target.value ? parseFloat(e.target.value) : null
                                            )
                                        }
                                        placeholder="kg"
                                        className="text-xs h-8 w-14"
                                    />
                                    <Input
                                        type="number"
                                        value={ex.sets}
                                        onChange={(e) => updateExercise(i, "sets", parseInt(e.target.value) || 1)}
                                        className="text-xs h-8 w-10"
                                        min={1}
                                    />
                                    <span className="text-xs text-muted-foreground">×</span>
                                    <Input
                                        type="number"
                                        value={ex.reps}
                                        onChange={(e) => updateExercise(i, "reps", parseInt(e.target.value) || 1)}
                                        className="text-xs h-8 w-10"
                                        min={1}
                                    />
                                    <button
                                        onClick={() => removeExercise(i)}
                                        className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addExercise}
                                className="w-full text-xs h-8"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Agregar ejercicio
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={saveRoutine} disabled={isSaving || !editorName.trim()}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
