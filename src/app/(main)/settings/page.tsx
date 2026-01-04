import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/Header"
import {
    User,
    Palette,
    Shield,
    Bell,
    Lock,
    ChevronRight,
} from "lucide-react"

const settingsLinks = [
    {
        href: "/settings/profile",
        icon: User,
        label: "Perfil",
        description: "Edita tu información personal",
    },
    {
        href: "/settings/appearance",
        icon: Palette,
        label: "Apariencia",
        description: "Tema y preferencias visuales",
    },
    {
        href: "/settings/privacy",
        icon: Shield,
        label: "Privacidad",
        description: "Quién puede ver tu contenido",
    },
    {
        href: "/settings/notifications",
        icon: Bell,
        label: "Notificaciones",
        description: "Configura tus alertas",
    },
    {
        href: "/settings/security",
        icon: Lock,
        label: "Seguridad",
        description: "Contraseña y sesiones",
    },
]

export default async function SettingsPage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    return (
        <>
            <Header title="Configuración" showBack />

            <div className="divide-y divide-border">
                {settingsLinks.map((link) => {
                    const Icon = link.icon
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-4 px-4 py-4 hover:bg-accent/50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{link.label}</p>
                                <p className="text-sm text-muted-foreground">
                                    {link.description}
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </Link>
                    )
                })}
            </div>
        </>
    )
}
