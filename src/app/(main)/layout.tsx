import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Sidebar } from "@/components/layout/Sidebar"
import { RightPanel } from "@/components/layout/RightPanel"
import { MobileNav } from "@/components/layout/MobileNav"

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="flex max-w-7xl mx-auto">
                {/* Left Sidebar - Desktop */}
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 min-h-screen border-x border-border min-w-0">
                    {children}
                </main>

                {/* Right Panel - Desktop */}
                <RightPanel />
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileNav />
        </div>
    )
}
