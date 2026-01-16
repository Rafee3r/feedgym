"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"

export function useNutrition(date: Date) {
    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true)
            const dateStr = format(date, "yyyy-MM-dd")
            const res = await fetch(`/api/nutrition/log?date=${dateStr}`)

            if (!res.ok) {
                throw new Error("Failed to fetch nutrition data")
            }

            const json = await res.json()
            setData(json)
            setError(null)
        } catch (err) {
            console.error(err)
            setError(err)
        } finally {
            setIsLoading(false)
        }
    }, [date])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return {
        dailyLog: data,
        isLoading,
        error,
        refresh: fetchData
    }
}
