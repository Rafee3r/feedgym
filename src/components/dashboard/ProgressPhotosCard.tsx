"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import {
    ChevronDown,
    Loader2,
    Camera,
    ImageIcon,
    Trash2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"

interface ProgressPhoto {
    id: string
    imageUrl: string
    category: "FRONT" | "SIDE" | "BACK"
    week: number
    year: number
    weight: number | null
    notes: string | null
    createdAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
    FRONT: "Frontal",
    SIDE: "Lateral",
    BACK: "Espalda",
}

const PROGRESS_CACHE_KEY = "feedgym-body-progress-cache"

function saveProgressCache(data: { photos: ProgressPhoto[]; hasPhotoThisWeek: boolean }) {
    try { localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

function loadProgressCache(): { photos: ProgressPhoto[]; hasPhotoThisWeek: boolean } | null {
    try {
        const raw = localStorage.getItem(PROGRESS_CACHE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

export function ProgressPhotosCard({ compact = false }: { compact?: boolean }) {
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Hydrate from cache
    const cached = loadProgressCache()
    const [photos, setPhotos] = useState<ProgressPhoto[]>(cached?.photos ?? [])
    const [hasPhotoThisWeek, setHasPhotoThisWeek] = useState(cached?.hasPhotoThisWeek ?? false)
    const [isLoading, setIsLoading] = useState(!cached)

    // Upload state
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [uploadCategory, setUploadCategory] = useState<"FRONT" | "SIDE" | "BACK">("FRONT")
    const [uploadPreview, setUploadPreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // Compare state
    const [isCompareOpen, setIsCompareOpen] = useState(false)
    const [compareIdx, setCompareIdx] = useState(0)

    // Delete confirm
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const fetchPhotos = useCallback(async () => {
        if (!session?.user) return
        try {
            const res = await fetch("/api/user/body-progress")
            if (res.ok) {
                const data = await res.json()
                setPhotos(data.photos)
                setHasPhotoThisWeek(data.hasPhotoThisWeek)
                saveProgressCache({ photos: data.photos, hasPhotoThisWeek: data.hasPhotoThisWeek })
            }
        } catch { /* silent */ } finally { setIsLoading(false) }
    }, [session?.user])

    useEffect(() => {
        fetchPhotos()
    }, [fetchPhotos])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            setUploadPreview(event.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleUpload = async () => {
        if (!uploadPreview) return
        setIsUploading(true)

        try {
            const res = await fetch("/api/user/body-progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl: uploadPreview,
                    category: uploadCategory,
                }),
            })

            if (res.ok) {
                await fetchPhotos()
                setIsUploadOpen(false)
                setUploadPreview(null)
            }
        } catch { /* silent */ } finally { setIsUploading(false) }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            const res = await fetch(`/api/user/body-progress?id=${deleteId}`, { method: "DELETE" })
            if (res.ok) {
                const updated = photos.filter((p) => p.id !== deleteId)
                setPhotos(updated)
                saveProgressCache({ photos: updated, hasPhotoThisWeek })
                setDeleteId(null)
            }
        } catch { /* silent */ }
    }

    // Group photos by week for comparison
    const photosByWeek = photos.reduce<Record<string, ProgressPhoto[]>>((acc, p) => {
        const key = `${p.year}-W${String(p.week).padStart(2, "0")}`
        if (!acc[key]) acc[key] = []
        acc[key].push(p)
        return acc
    }, {})
    const weekKeys = Object.keys(photosByWeek).sort().reverse()

    const openCompare = () => {
        setCompareIdx(0)
        setIsCompareOpen(true)
    }

    if (!compact) return null

    return (
        <>
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                {/* Header */}
                <button
                    className="flex items-center justify-between w-full px-4 py-3"
                    onClick={() => setIsOpen((o) => !o)}
                    aria-expanded={isOpen}
                >
                    <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Progreso Corporal</span>
                        {!hasPhotoThisWeek && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                </button>

                {/* Content */}
                {isOpen && (
                    <div className="px-4 pb-4 border-t border-border/30 space-y-3 pt-3">
                        {isLoading ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                {/* Weekly reminder */}
                                {!hasPhotoThisWeek && (
                                    <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                        <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                                Foto semanal pendiente
                                            </p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Sube tu foto semanal para comparar tu progreso. Misma posición y distancia.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Upload button */}
                                <button
                                    onClick={() => { setUploadPreview(null); setIsUploadOpen(true) }}
                                    className="w-full py-2.5 flex items-center justify-center gap-2 border border-dashed border-border/60 rounded-xl text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                                >
                                    <Camera className="w-3.5 h-3.5" />
                                    Subir foto
                                </button>

                                {/* Photos timeline */}
                                {weekKeys.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {photos.length} foto{photos.length !== 1 ? "s" : ""} · {weekKeys.length} semana{weekKeys.length !== 1 ? "s" : ""}
                                            </span>
                                            {weekKeys.length >= 2 && (
                                                <button
                                                    onClick={openCompare}
                                                    className="text-[11px] font-medium text-primary hover:underline"
                                                >
                                                    Comparar →
                                                </button>
                                            )}
                                        </div>

                                        {/* Thumbnail grid — show latest 6 */}
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {photos.slice(0, 6).map((photo) => (
                                                <div
                                                    key={photo.id}
                                                    className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-muted cursor-pointer"
                                                    onClick={() => { setCompareIdx(0); setIsCompareOpen(true) }}
                                                >
                                                    <img
                                                        src={photo.imageUrl.startsWith("data:") ? photo.imageUrl : `/api/media/${photo.id}`}
                                                        alt={`Progreso ${CATEGORY_LABELS[photo.category]}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                                                        <span className="text-[9px] text-white font-medium">
                                                            S{photo.week} · {CATEGORY_LABELS[photo.category]}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteId(photo.id) }}
                                                        className="absolute top-1 right-1 p-1 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-4 gap-2 text-center">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                                        <p className="text-xs text-muted-foreground">
                                            Sin fotos aún. Sube tu primera foto semanal.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Upload Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Camera className="w-5 h-5 text-primary" />
                            Foto Semanal
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Tips */}
                        <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                            <p className="font-medium text-foreground text-xs mb-1">📸 Tips para consistencia:</p>
                            <p>• Misma posición y distancia cada semana</p>
                            <p>• Buena iluminación, fondo neutro</p>
                            <p>• Mismo horario (ej. mañana en ayunas)</p>
                        </div>

                        {/* Category selector */}
                        <div className="flex gap-2">
                            {(["FRONT", "SIDE", "BACK"] as const).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setUploadCategory(cat)}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                        uploadCategory === cat
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background border-border text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {CATEGORY_LABELS[cat]}
                                </button>
                            ))}
                        </div>

                        {/* File input / preview */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {uploadPreview ? (
                            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                                <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => { setUploadPreview(null); fileInputRef.current?.click() }}
                                    className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg"
                                >
                                    Cambiar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-[3/4] border-2 border-dashed border-border/60 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-colors"
                            >
                                <Camera className="w-8 h-8 text-muted-foreground/40" />
                                <span className="text-xs text-muted-foreground">Toca para seleccionar foto</span>
                            </button>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpload} disabled={!uploadPreview || isUploading}>
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Compare Dialog — side-by-side week slider */}
            <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Comparar Progreso</DialogTitle>
                        <DialogDescription>
                            Desliza para comparar semanas
                        </DialogDescription>
                    </DialogHeader>

                    {weekKeys.length >= 2 && (
                        <div className="space-y-4">
                            {/* Week navigation */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setCompareIdx((i) => Math.max(0, i - 1))}
                                    disabled={compareIdx === 0}
                                    className="p-2 rounded-lg hover:bg-accent disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-medium">
                                    {weekKeys[compareIdx]} vs {weekKeys[Math.min(compareIdx + 1, weekKeys.length - 1)]}
                                </span>
                                <button
                                    onClick={() => setCompareIdx((i) => Math.min(weekKeys.length - 2, i + 1))}
                                    disabled={compareIdx >= weekKeys.length - 2}
                                    className="p-2 rounded-lg hover:bg-accent disabled:opacity-30"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Side by side */}
                            <div className="grid grid-cols-2 gap-2">
                                {[compareIdx, Math.min(compareIdx + 1, weekKeys.length - 1)].map((idx) => {
                                    const weekPhotos = photosByWeek[weekKeys[idx]] || []
                                    const photo = weekPhotos[0]
                                    return (
                                        <div key={weekKeys[idx]} className="space-y-1">
                                            <p className="text-[11px] text-center font-medium text-muted-foreground">
                                                {weekKeys[idx]}
                                            </p>
                                            {photo ? (
                                                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                                                    <img
                                                        src={photo.imageUrl.startsWith("data:") ? photo.imageUrl : `/api/media/${photo.id}`}
                                                        alt={`Semana ${weekKeys[idx]}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center">
                                                    <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {weekKeys.length < 2 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Necesitas al menos 2 semanas de fotos para comparar.
                        </p>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>¿Eliminar foto?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
