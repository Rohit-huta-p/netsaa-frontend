import { z } from 'zod';

export const eventSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),

    eventType: z.string().min(1, 'Event type is required'),
    category: z.string().min(1, 'Category is required'),
    tags: z.string().or(z.array(z.string())), // Allow command separated string input that we parse later, or array

    skillLevel: z.enum(['all', 'beginner', 'intermediate', 'advanced']),

    // Schedule
    startDate: z.string().min(1, 'Start date is required'), // Validate as date string later
    endDate: z.string().min(1, 'End date is required'),

    // Location
    city: z.string().min(1, 'City is required'),
    venue: z.string().optional(),
    address: z.string().optional(),

    // Capacity & Price (handled slightly differently in form vs backend model initially)
    // Capacity & Price
    maxParticipants: z.coerce.number().int().positive('Must be at least 1'),

    // Legacy/Simple price - keep as optional or summary, but main data is ticketTypes
    ticketPrice: z.coerce.number().min(0).optional(),

    ticketTypes: z.array(z.object({
        name: z.string().min(1, 'Name is required'),
        price: z.coerce.number().min(0, 'Price must be 0 or greater'),
        capacity: z.coerce.number().int().positive('Capacity must be at least 1'),
        salesStartAt: z.string().min(1, 'Start date required'),
        salesEndAt: z.string().min(1, 'End date required'),
        isRefundable: z.boolean(),
        refundPolicyNotes: z.string().optional(),
        currency: z.literal('INR').default('INR'),
    })).optional(),

    deadline: z.string().optional(),

    urgent: z.boolean().default(false),
    featured: z.boolean().default(false),
});

export type EventFormData = z.infer<typeof eventSchema>;
