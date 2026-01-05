import { z } from 'zod';

export const artistRegisterSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    dob: z.string().min(1, 'Date of birth is required'), // YYYY-MM-DD
    gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
    artistType: z.string().min(1, 'Artist type is required'),
    skills: z.string().min(1, 'At least one skill is required'), // Comma separated for now
    experienceLevel: z.enum(['Beginner', 'Intermediate', 'Professional']),
    city: z.string().min(2, 'City is required'),
    bio: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ArtistRegisterFormData = z.infer<typeof artistRegisterSchema>;

export const organizerRegisterSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    organizationName: z.string().optional(),
    industry: z.string().min(1, 'Industry is required'),
    budgetMin: z.string().regex(/^\d+$/, 'Must be a number'),
    budgetMax: z.string().regex(/^\d+$/, 'Must be a number'),
    city: z.string().min(2, 'City is required'),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    bio: z.string().optional(),
});

export type OrganizerRegisterFormData = z.infer<typeof organizerRegisterSchema>;
