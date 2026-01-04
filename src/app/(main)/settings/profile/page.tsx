"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Camera } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getInitials } from "@/lib/utils"

export default function ProfileSettingsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [profile, setProfile] = useState({
        displayName: "",
        bio: "",
        location: "",
        website: "",
        pronouns: "",
        gymSplit: "",
        avatarUrl: "",
    })

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("/api/users/me")
                if (response.ok) {
                    const data = await response.json()
                    setProfile({
                        displayName: data.displayName || "",
                        bio: data.bio || "",
                        location: data.location || "",
                        website: data.website || "",
                        pronouns: data.pronouns || "",
                        gymSplit: data.gymSplit || "",
                        avatarUrl: data.avatarUrl || "",
                    })
                }
            } catch (err) {
                console.error("Error fetching profile:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName: profile.displayName,
                    bio: profile.bio || null,
                    location: profile.location || null,
                    website: profile.website || null,
                    pronouns: profile.pronouns || null,
                    gymSplit: profile.gymSplit || null,
                }),
            })

            if (response.ok) {
                toast({
                    title: "Perfil actualizado",
                    description: "Tus cambios han sido guardados",
                    variant: "success",
                })
                router.refresh()
            } else {
                throw new Error("Error al guardar")
            }
        } catch {
            toast({
                title: "Error",
                description: "No se pudieron guardar los cambios",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <>
                <Header title="Editar perfil" showBack />
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Editar perfil" showBack />

            <div className="p-4 space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={profile.avatarUrl || undefined} />
                            <AvatarFallback className="text-2xl">
                                {getInitials(profile.displayName)}
                            </AvatarFallback>
                        </Avatar>
                        <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Cambiar foto de perfil
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Nombre</Label>
                        <Input
                            id="displayName"
                            value={profile.displayName}
                            onChange={(e) =>
                                setProfile({ ...profile, displayName: e.target.value })
                            }
                            maxLength={50}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Biografía</Label>
                        <Textarea
                            id="bio"
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            placeholder="Cuéntanos sobre ti..."
                            maxLength={160}
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {profile.bio.length}/160
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Ubicación</Label>
                        <Input
                            id="location"
                            value={profile.location}
                            onChange={(e) =>
                                setProfile({ ...profile, location: e.target.value })
                            }
                            placeholder="Ciudad, País"
                            maxLength={50}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Sitio web</Label>
                        <Input
                            id="website"
                            type="url"
                            value={profile.website}
                            onChange={(e) =>
                                setProfile({ ...profile, website: e.target.value })
                            }
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pronouns">Pronombres</Label>
                        <Input
                            id="pronouns"
                            value={profile.pronouns}
                            onChange={(e) =>
                                setProfile({ ...profile, pronouns: e.target.value })
                            }
                            placeholder="él/él, ella/ella, etc."
                            maxLength={20}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gymSplit">Rutina de entrenamiento</Label>
                        <Input
                            id="gymSplit"
                            value={profile.gymSplit}
                            onChange={(e) =>
                                setProfile({ ...profile, gymSplit: e.target.value })
                            }
                            placeholder="PPL, Upper/Lower, Full Body..."
                            maxLength={30}
                        />
                    </div>
                </div>

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    disabled={isSaving || !profile.displayName.trim()}
                    className="w-full rounded-full"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        "Guardar cambios"
                    )}
                </Button>
            </div>
        </>
    )
}
