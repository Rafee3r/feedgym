"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Sparkles, Loader2, RefreshCw, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const REPORT_CACHE_KEY = "feedgym-weekly-report"
const REPORT_CACHE_TS_KEY = "feedgym-weekly-report-ts"
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

function getCachedReport(): { report: string; postsAnalyzed: number; prsCount: number } | null {
    try {
        const ts = localStorage.getItem(REPORT_CACHE_TS_KEY)
        if (!ts || Date.now() - parseInt(ts, 10) > CACHE_DURATION_MS) return null
        const raw = localStorage.getItem(REPORT_CACHE_KEY)
        if (!raw) return null
        return JSON.parse(raw)
    } catch {
        return null
    }
}

function saveCachedReport(data: { report: string; postsAnalyzed: number; prsCount: number }) {
    try {
        localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(data))
        localStorage.setItem(REPORT_CACHE_TS_KEY, Date.now().toString())
    } catch {
        // ignore
    }
}

interface WeeklyReportCardProps {
    compact?: boolean
    className?: string
}

export function WeeklyReportCard({ compact = false, className }: WeeklyReportCardProps) {
    const { data: session } = useSession()
    const [report, setReport] = useState<string | null>(() => getCachedReport()?.report ?? null)
    const [isLoading, setIsLoading] = useState(false)
    const [stats, setStats] = useState<{ postsAnalyzed: number; prsCount: number } | null>(
        () => {
            const cached = getCachedReport()
            return cached ? { postsAnalyzed: cached.postsAnalyzed, prsCount: cached.prsCount } : null
        }
    )

    const generateReport = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/user/weekly-report")
            if (res.ok) {
                const data = await res.json()
                setReport(data.report)
                setStats({ postsAnalyzed: data.postsAnalyzed, prsCount: data.prsCount })
                saveCachedReport({ report: data.report, postsAnalyzed: data.postsAnalyzed, prsCount: data.prsCount })
            }
        } catch {
            setReport("Error al generar el reporte. Intenta de nuevo.")
        } finally {
            setIsLoading(false)
        }
    }

    if (!session) return null

    // ── Compact mode (mobile) ──
    if (compact) {
        return (
            <div className={`shrink-0 ${className ?? ""}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <span className="text-xs font-semibold text-foreground">Reporte Semanal</span>
                    </div>
                    {report && (
                        <Button
                            onClick={generateReport}
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-violet-500"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    )}
                </div>

                {report ? (
                    <div className="bg-card/50 border border-border/50 rounded-lg p-3">
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{report}</p>
                        {stats && (
                            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/30">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {stats.postsAnalyzed} entrenamientos · {stats.prsCount} PRs
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <Button
                        onClick={generateReport}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-9 border-violet-500/20 text-violet-500 hover:bg-violet-500/10"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Analizando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                Generar reporte IA
                            </>
                        )}
                    </Button>
                )}
            </div>
        )
    }

    // ── Full mode (desktop sidebar) ──
    return (
        <Card className={`bg-transparent border-0 shadow-none shrink-0 ${className ?? ""}`}>
            <CardHeader className="pb-2 px-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-violet-500" />
                        Reporte Semanal
                    </CardTitle>
                    {report && (
                        <Button
                            onClick={generateReport}
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-violet-500"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-0 pt-0">
                {report ? (
                    <div className="bg-card/50 rounded-xl border border-border/50 p-4">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{report}</p>
                        {stats && (
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {stats.postsAnalyzed} entrenamientos · {stats.prsCount} PRs
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <Button
                        onClick={generateReport}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full border-violet-500/20 text-violet-500 hover:bg-violet-500/10"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Analizando tu semana...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generar reporte IA
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
