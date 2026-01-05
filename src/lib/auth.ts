import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

// Define UserRole locally to avoid Prisma client import issues in Edge/Serverless
type UserRole = "USER" | "ADMIN" | "STAFF";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const validated = loginSchema.safeParse(credentials);
                    if (!validated.success) {
                        console.error("[Auth] Validation failed:", validated.error.errors);
                        return null;
                    }

                    const { email, password } = validated.data;

                    const user = await prisma.user.findUnique({
                        where: { email: email.toLowerCase() },
                    });

                    if (!user || !user.hashedPassword) {
                        console.error("[Auth] User not found or no password:", email);
                        return null;
                    }

                    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
                    if (!passwordMatch) {
                        console.error("[Auth] Password mismatch for:", email);
                        return null;
                    }

                    // Check if user is banned
                    if ((user as any).isBanned) {
                        console.error("[Auth] Banned user attempted login:", email);
                        throw new Error("BANNED");
                    }

                    console.log("[Auth] Login successful for:", email);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.displayName,
                        image: user.avatarUrl,
                        username: user.username,
                        role: (user as { role?: UserRole }).role ?? "USER",
                    };
                } catch (error) {
                    console.error("[Auth] Critical error in authorize:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id ?? "";
                token.username = (user as { username?: string }).username ?? "";
                token.role = (user as { role?: UserRole }).role ?? "USER";

                // Admin flags
                const u = user as any;
                token.isBanned = u.isBanned ?? false;
                token.isShadowbanned = u.isShadowbanned ?? false;
                token.isFrozen = u.isFrozen ?? false;
                token.mutedUntil = u.mutedUntil ?? null;

                // Safety check: Don't store massive base64 in token on initial login
                if (user.image && user.image.startsWith("data:image")) {
                    token.picture = null;
                }
            }
            if (trigger === "update" && session) {
                // Safety check: Prevent updates from injecting massive base64
                if (session.image && !session.image.startsWith("data:image")) {
                    token.picture = session.image;
                }
                if (session.name) token.name = session.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.image = (token.picture as string) || undefined;
                session.user.role = (token.role as UserRole) || "USER";

                // Fetch fresh ban status from DB to ensure real-time ban enforcement
                try {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { isBanned: true, isShadowbanned: true, isFrozen: true, mutedUntil: true }
                    });

                    if (freshUser) {
                        // If user is banned, invalidate session by returning empty user
                        if ((freshUser as any).isBanned) {
                            // Return null session to force logout
                            return {
                                ...session,
                                user: undefined as any,
                                expires: new Date(0).toISOString() // Expire immediately
                            };
                        }

                        session.user.isBanned = (freshUser as any).isBanned ?? false;
                        session.user.isShadowbanned = (freshUser as any).isShadowbanned ?? false;
                        session.user.isFrozen = (freshUser as any).isFrozen ?? false;
                        session.user.mutedUntil = (freshUser as any).mutedUntil?.toISOString() ?? null;
                    } else {
                        // User from token, use cached values
                        session.user.isBanned = token.isBanned as boolean;
                        session.user.isShadowbanned = token.isShadowbanned as boolean;
                        session.user.isFrozen = token.isFrozen as boolean;
                        session.user.mutedUntil = token.mutedUntil as string | null;
                    }
                } catch (error) {
                    // Fallback to token values if DB query fails
                    session.user.isBanned = token.isBanned as boolean;
                    session.user.isShadowbanned = token.isShadowbanned as boolean;
                    session.user.isFrozen = token.isFrozen as boolean;
                    session.user.mutedUntil = token.mutedUntil as string | null;
                }
            }
            return session;
        },
    },
});

// Type augmentation for session
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            image?: string;
            username: string;
            role: UserRole;
            isBanned: boolean;
            isShadowbanned: boolean;
            isFrozen: boolean;
            mutedUntil: string | null;
        };
    }

    interface User {
        username?: string;
        role?: UserRole;
        isBanned?: boolean;
        isShadowbanned?: boolean;
        isFrozen?: boolean;
        mutedUntil?: Date | string | null;
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        id: string;
        username: string;
        role: UserRole;
        isBanned: boolean;
        isShadowbanned: boolean;
        isFrozen: boolean;
        mutedUntil: Date | string | null;
    }
}
