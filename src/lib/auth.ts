import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { JWT } from "next-auth/jwt";
import { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
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

                    console.log("[Auth] Login successful for:", email);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.displayName,
                        image: user.avatarUrl,
                        username: user.username,
                        role: user.role,
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
            }
            if (trigger === "update" && session) {
                if (session.image) token.picture = session.image;
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
        };
    }

    interface User {
        username?: string;
        role?: UserRole;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        username: string;
        role: UserRole;
    }
}
