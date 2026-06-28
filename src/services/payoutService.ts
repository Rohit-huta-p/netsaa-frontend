import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_EVENT_URL || 'https://netsaa-events-service.onrender.com';
const client = axios.create({ baseURL: BASE_URL, timeout: 15000 });
client.interceptors.request.use((c) => { const t = useAuthStore.getState().accessToken; if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

export type PayoutStatus = 'not_started' | 'submitted' | 'pending_kyc' | 'verified' | 'rejected' | 'suspended';

export interface PayoutAccount {
  status: PayoutStatus; panMasked?: string; bankLast4?: string; bankName?: string;
  accountHolderName?: string; gstin?: string; rejectionReason?: string; linkedAccountId?: string;
}

export const payoutService = {
  getMine: async (): Promise<PayoutAccount> => (await client.get('/v1/payouts/account/me')).data.data,
  submit: async (body: {
    businessType: string; pan: string; accountHolderName: string;
    bankAccount: string; ifsc: string; gstin?: string; email: string;
  }): Promise<PayoutAccount> => (await client.post('/v1/payouts/account', body)).data.data,
};
