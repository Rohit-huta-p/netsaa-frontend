import { create } from 'zustand';
import { EventFormData } from '@/schemas/eventSchema';

interface CreateEventState {
    currentStep: number;
    completedSteps: number[];
    formData: Partial<EventFormData> & { pricingMode?: 'simple' | 'types' }; // extending partial form data with UI state

    setStep: (step: number) => void;
    setCompletedSteps: (steps: number[]) => void;
    updateFormData: (data: Partial<EventFormData>) => void;
    resetForm: () => void;
}

const INITIAL_DATA: Partial<EventFormData> & { pricingMode?: 'simple' | 'types' } = {
    title: 'Sagar Bora workshop',
    description: 'Sagar Bora workshop, amazing workshop',
    category: 'dance',
    tags: 'hiphop',
    city: 'Pune',
    venue: 'Pune',
    address: 'Pune',
    startDate: '2025-12-26',
    endDate: '2025-12-26',
    eventType: 'battle',
    skillLevel: 'all',
    ticketPrice: 0,
    ticketTypes: [],
    pricingMode: 'simple', // 'simple' | 'types'
    maxParticipants: 100,
    deadline: '',
    urgent: false,
    featured: false,
};

export const useCreateEventStore = create<CreateEventState>((set) => ({
    currentStep: 1,
    completedSteps: [],
    formData: INITIAL_DATA,

    setStep: (step) => set({ currentStep: step }),
    setCompletedSteps: (steps) => set({ completedSteps: steps }),
    updateFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),
    resetForm: () => set({
        currentStep: 1,
        completedSteps: [],
        formData: INITIAL_DATA
    }),
}));
