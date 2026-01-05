"use client"

import { useState } from "react"
import {
    MoreVertical,
    ShieldAlert,
    Ban,
    EyeOff,
    Snowflake,
    MicOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface AdminControlsProps {
    userId: string
    username: string
    status: {
        isBanned: boolean
        isShadowbanned: boolean
        isFrozen: boolean
        mutedUntil: Date | string | null
    }
}

export function AdminControls({ userId, username, status: initialStatus }: AdminControlsProps) {
    const router = useRouter()
    const [status, setStatus] = useState(initialStatus)
    const [isLoading, setIsLoading] = useState(false)
    const [isMuteOpen, setIsMuteOpen] = useState(false)
    const [muteDuration, setMuteDuration] = useState("60")

    const handleAction = async (action: string, duration?: number) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/users/${userId}/actions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, duration }),
            })

            if (!response.ok) throw new Error("Error en acción administrativa")

            const updatedUser = await response.json()
            setStatus({
                isBanned: updatedUser.isBanned,
                isShadowbanned: updatedUser.isShadowbanned,
                isFrozen: updatedUser.isFrozen,
                mutedUntil: updatedUser.mutedUntil,
            })

            toast({
                title: "Acción completada",
                description: `El estado de @${username} ha sido actualizado.`,
                variant: "success",
            })
            router.refresh()
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo realizar la acción.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
            setIsMuteOpen(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                        <ShieldAlert className="w-5 h-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={() => handleAction(status.isBanned ? "unban" : "ban")}
                        className={status.isBanned ? "text-green-600" : "text-destructive"}
                    >
                        <Ban className="w-4 h-4 mr-2" />
                        {status.isBanned ? "Desbanear" : "Banear Permanentemente"}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => handleAction(status.isShadowbanned ? "unshadowban" : "shadowban")}
                    >
                        <EyeOff className="w-4 h-4 mr-2" />
                        {status.isShadowbanned ? "Quitar Shadowban" : "Shadowban"}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => handleAction(status.isFrozen ? "unfreeze" : "freeze")}
                    >
                        <Snowflake className="w-4 h-4 mr-2" />
                        {status.isFrozen ? "Descongelar" : "Congelar Cuenta"}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setIsMuteOpen(true)}>
                        <MicOff className="w-4 h-4 mr-2" />
                        {status.mutedUntil ? "Modificar Mute" : "Silenciar (Mute)"}
                    </DropdownMenuItem>

                    {status.mutedUntil && (
                        <DropdownMenuItem onClick={() => handleAction("unmute")}>
                            <MicOff className="w-4 h-4 mr-2" />
                            Quitar Silencio
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isMuteOpen} onOpenChange={setIsMuteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Silenciar a @{username}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Duración (minutos)</Label>
                            <Input
                                type="number"
                                value={muteDuration}
                                onChange={(e) => setMuteDuration(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMuteOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => handleAction("mute", parseInt(muteDuration) || 60)}
                            disabled={isLoading}
                        >
                            Silenciar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
