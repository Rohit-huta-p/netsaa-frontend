import { useQuery } from '@tanstack/react-query';

import { User } from '../types'
import authService from '@/services/authService';

// Keys
export const userKeys = {
    all: ['users'] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
};

export const useUser = (id: string | undefined) => {
    return useQuery<User, Error>({
        queryKey: userKeys.detail(id || ''),
        queryFn: () => authService.getUserById(id!),
        enabled: !!id,
    });
};
