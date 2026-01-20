"use client"

import { useState, useRef, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageViewerProps {
    src: string
    alt?: string
    isOpen: boolean
    onClose: () => void
}

export function ImageViewer({ src, alt = "Image", isOpen, onClose }: ImageViewerProps) {
    const [scale, setScale] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setScale(1)
            setRotation(0)
            setPosition({ x: 0, y: 0 })
        }
    }, [isOpen])

    // Handle keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return
            if (e.key === "Escape") onClose()
            if (e.key === "+" || e.key === "=") setScale(s => Math.min(s + 0.25, 5))
            if (e.key === "-") setScale(s => Math.max(s - 0.25, 0.25))
            if (e.key === "r") setRotation(r => r + 90)
            if (e.key === "0") { setScale(1); setPosition({ x: 0, y: 0 }); setRotation(0) }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onClose])

    // Handle wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setScale(s => Math.min(Math.max(s + delta, 0.25), 5))
    }

    // Handle drag
    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true)
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Handle touch for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && scale > 1) {
            setIsDragging(true)
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            })
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging && e.touches.length === 1) {
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            })
        }
    }

    const handleDownload = async () => {
        try {
            const response = await fetch(src)
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = alt || "image"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Download failed:", error)
        }
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-white relative z-10 w-full bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => setScale(s => Math.max(s - 0.25, 0.25))}
                    >
                        <ZoomOut className="w-5 h-5" />
                    </Button>
                    <span className="text-sm font-medium min-w-[60px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => setScale(s => Math.min(s + 0.25, 5))}
                    >
                        <ZoomIn className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => setRotation(r => r + 90)}
                    >
                        <RotateCw className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={handleDownload}
                    >
                        <Download className="w-5 h-5" />
                    </Button>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={onClose}
                >
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Image Container */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden flex items-center justify-center cursor-move"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => setIsDragging(false)}
            >
                <img
                    src={src}
                    alt={alt}
                    className={cn(
                        "max-h-full max-w-full object-contain select-none transition-transform duration-100",
                        isDragging && "transition-none"
                    )}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                        cursor: scale > 1 ? "grab" : "zoom-in"
                    }}
                    draggable={false}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (scale === 1) setScale(2)
                        else { setScale(1); setPosition({ x: 0, y: 0 }) }
                    }}
                />
            </div>

            {/* Footer hints */}
            <div className="p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-center text-xs text-white/50 bg-gradient-to-t from-black/50 to-transparent w-full">
                Scroll para zoom • Click para ampliar • Arrastra para mover • ESC para cerrar
            </div>
        </div>
    )
}
