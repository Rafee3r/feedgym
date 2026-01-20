"use client"

import { useSearchParams } from "next/navigation"
import { CoachChat } from "@/components/coach/CoachChat"
import { Suspense } from "react"

function CoachPageContent() {
    const searchParams = useSearchParams()
    const initialMessage = searchParams.get("message") || undefined

    return (
        <div className="h-[calc(100vh-1px)] flex flex-col">
            <CoachChat className="flex-1" initialMessage={initialMessage} />
        </div>
    )
}

export default function CoachPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Cargando...</div>}>
            <CoachPageContent />
        </Suspense>
    )
}
