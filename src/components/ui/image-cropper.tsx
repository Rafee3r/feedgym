"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
// Using native range for now as Slider was not found.
import getCroppedImg from "@/lib/canvasUtils"
import { Loader2, ZoomIn, ZoomOut } from "lucide-react"

interface ImageCropperProps {
    isOpen: boolean
    onClose: () => void
    imageSrc: string | null
    onCropComplete: (croppedImage: string) => void
    aspect?: number // 1 for square (avatar), 3/1 for banner
}

export function ImageCropper({
    isOpen,
    onClose,
    imageSrc,
    onCropComplete,
    aspect = 1,
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return

        setIsProcessing(true)
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
            onCropComplete(croppedImage)
            onClose()
        } catch (e) {
            console.error(e)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Ajustar imagen</DialogTitle>
                    <DialogDescription>
                        Arrastra para mover y usa el slider para hacer zoom.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative w-full h-80 bg-black rounded-md overflow-hidden">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={onCropChange}
                            onCropComplete={onCropCompleteCallback}
                            onZoomChange={onZoomChange}
                        />
                    )}
                </div>

                <div className="flex items-center gap-4 py-4">
                    <ZoomOut className="w-4 h-4 text-muted-foreground" />
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isProcessing}>
                        {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Aplicar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
