import { handlers } from "@/lib/auth"

// Force Node.js runtime (required for Prisma + bcrypt)
export const runtime = "nodejs"

export const { GET, POST } = handlers
