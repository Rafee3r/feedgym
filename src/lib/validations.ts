import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
        .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
        .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
    username: z
        .string()
        .min(3, "El username debe tener al menos 3 caracteres")
        .max(20, "El username no puede tener más de 20 caracteres")
        .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guiones bajos"),
    displayName: z.string().max(50).optional(),
    invitationCode: z.string().min(1, "El código de invitación es requerido"),
});

export const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "La contraseña es requerida"),
});

export const postSchema = z.object({
    content: z
        .string()
        .min(1, "El contenido es requerido")
        .max(500, "Máximo 500 caracteres"),
    type: z.enum(["NOTE", "WORKOUT", "PROGRESS", "PR", "MEAL"]).default("NOTE"),
    imageUrl: z.string().url().optional().nullable(),
    mediaUrls: z.array(z.string().url()).max(5).optional().default([]),
    parentId: z.string().optional().nullable(),
    audience: z.enum(["PUBLIC", "FOLLOWERS", "CLOSE_FRIENDS", "ONLY_ME"]).default("PUBLIC"),
    metadata: z
        .object({
            exercise: z.string().optional(),
            sets: z.number().optional(),
            reps: z.number().optional(),
            weight: z.number().optional(),
            unit: z.enum(["KG", "LB"]).optional(),
            rpe: z.number().min(1).max(10).optional(),
            duration: z.number().optional(), // in minutes
            audioUrl: z.string().optional(),
        })
        .optional()
        .nullable(),
});

export const updateProfileSchema = z.object({
    displayName: z.string().min(1).max(50).optional(),
    bio: z.string().max(160).optional().nullable(),
    location: z.string().max(50).optional().nullable(),
    website: z.string().url().optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
    bannerUrl: z.string().url().optional().nullable(),
    pronouns: z.string().max(20).optional().nullable(),
    gymSplit: z.string().max(30).optional().nullable(),
    trainingDays: z.array(z.string()).optional(),
    goal: z.enum(["CUT", "BULK", "MAINTAIN", "RECOMP"]).optional(),
});

export const weightLogSchema = z.object({
    weight: z.number().positive("El peso debe ser positivo"),
    unit: z.enum(["KG", "LB"]).default("KG"),
    notes: z.string().max(200).optional().nullable(),
    loggedAt: z.string().datetime().optional(),
});

export const privacySettingsSchema = z.object({
    accountPrivacy: z.enum(["PUBLIC", "FOLLOWERS_ONLY", "PRIVATE"]).optional(),
    allowDMs: z.enum(["EVERYONE", "FOLLOWERS", "NOBODY"]).optional(),
    showMetrics: z.boolean().optional(),
    discoverable: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type WeightLogInput = z.infer<typeof weightLogSchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
