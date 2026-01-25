// src/schemas/register.schema.ts
import { z } from "zod";

export const registerSchema = z.object({
    fullName: z.string().min(2, "Stage name or Full name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["artist", "organizer"]),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export type RoleCardColors = {
    bg: string;
    border: string;
    iconBg: string;
};
