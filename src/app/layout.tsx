import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "FeedGym - Tu Red Social Fitness",
    description:
        "Comparte tu progreso, entrenamientos y conecta con la comunidad fitness",
    keywords: ["gym", "fitness", "social", "workout", "progress", "pr"],
    authors: [{ name: "FeedGym" }],
    icons: {
        icon: "/icon.png",
        apple: "/icon.png",
    },
    openGraph: {
        title: "FeedGym - Tu Red Social Fitness",
        description:
            "Comparte tu progreso, entrenamientos y conecta con la comunidad fitness",
        type: "website",
        locale: "es_ES",
        siteName: "FeedGym",
    },
    twitter: {
        card: "summary_large_image",
        title: "FeedGym",
        description: "Tu Red Social Fitness",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "FeedGym",
        startupImage: ["/icon.png"],
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover", // For notch support
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className}>
                <SessionProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                        <Toaster />
                    </ThemeProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
