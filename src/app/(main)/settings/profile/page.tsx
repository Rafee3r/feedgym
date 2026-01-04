"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
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
    const { update } = useSession()
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
        bannerUrl: "",
    })

    const fileInputRef = useRef<HTMLInputElement>(null)
    const bannerInputRef = useRef<HTMLInputElement>(null)

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
                        bannerUrl: data.bannerUrl || "",
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

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, field: "avatarUrl" | "bannerUrl") => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "Error",
                    description: "La imagen es muy pesada (max 5MB)",
                    variant: "destructive",
                })
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, [field]: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

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
                    avatarUrl: profile.avatarUrl || null,
                    bannerUrl: profile.bannerUrl || null,
                }),
            })

            if (response.ok) {
                // Update client session
                await update({
                    name: profile.displayName,
                    image: profile.avatarUrl,
                })

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

            <div className="space-y-6">
                {/* Banner & Avatar Wrapper */}
                <div className="relative mb-16">
                    {/* Banner */}
                    <div
                        className="h-32 sm:h-48 bg-muted relative bg-cover bg-center cursor-pointer group"
                        style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : undefined}
                        onClick={() => bannerInputRef.current?.click()}
                    >
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={bannerInputRef}
                            onChange={(e) => handleImageSelect(e, "bannerUrl")}
                        />
                    </div>

                    {/* Avatar */}
                    <div className="absolute -bottom-12 left-4">
                        <div className="relative group">
                            <Avatar className="w-24 h-24 border-4 border-background">
                                <AvatarImage src={profile.avatarUrl || undefined} />
                                <AvatarFallback className="text-2xl">
                                    {getInitials(profile.displayName)}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={(e) => handleImageSelect(e, "avatarUrl")}
                            />
                        </div>
                    </div>
                </div>

                <div className="px-4 space-y-4">
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
