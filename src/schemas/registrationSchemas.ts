// src/schemas/registrationSchemas.ts
import { z } from 'zod';

// Artist schema example
export const ArtistProfileSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
    email: z.string().email('Invalid email'),
    stageName: z.string().min(1, 'Stage name required'),
    genres: z.array(z.string()).optional(),
    phone: z.string().min(6).optional(),
    bio: z.string().max(1000).optional(),
});

export type ArtistProfile = z.infer<typeof ArtistProfileSchema>;

// Organizer schema example
export const OrganizerProfileSchema = z.object({
    companyName: z.string().min(1, 'Company name required'),
    contactPerson: z.string().min(1, 'Contact person required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(6, 'Invalid phone'),
    address: z.string().optional(),
    gstNumber: z.string().optional(),
});

export type OrganizerProfile = z.infer<typeof OrganizerProfileSchema>;

// Combined registration step schemas (example)
export const RegistrationStep1Schema = z.object({
    role: z.enum(['artist', 'organizer']),
});

export const RegistrationStep2ArtistSchema = ArtistProfileSchema.pick({
    firstName: true,
    email: true,
    stageName: true,
});

export const RegistrationStep2OrganizerSchema = OrganizerProfileSchema.pick({
    companyName: true,
    email: true,
    contactPerson: true,
});
