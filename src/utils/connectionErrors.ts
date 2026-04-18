/**
 * Parse a backend connection error into a user-friendly message.
 *
 * Backend returns structured payloads for the 3 limit codes:
 *   {success:false, code:'rate_limited'|'cooldown_withdraw'|'cooldown_decline'|'blocked',
 *    message, retryAfterDays}
 *
 * HTTP status: 429 for rate_limited, 409 for cooldowns + blocked, 400 otherwise.
 */
export type ConnectionErrorInfo = {
    title: string;
    message: string;
    /** True when the error is "already exists" — caller should silently refresh state. */
    swallow?: boolean;
};

export function interpretConnectionError(err: any): ConnectionErrorInfo {
    const data = err?.response?.data ?? {};
    const code = data.code as string | undefined;
    const serverMsg = data.message as string | undefined;
    const retry = data.retryAfterDays as number | undefined;

    if (typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('already')) {
        return { title: '', message: '', swallow: true };
    }

    switch (code) {
        case 'rate_limited':
            return {
                title: 'Weekly limit reached',
                message: `You've hit the 50 requests/week cap. Try again in ${retry ?? 7} day(s).`,
            };
        case 'cooldown_withdraw':
            return {
                title: 'Too soon',
                message: `You recently withdrew a request to this user. Wait ${retry ?? 14} more day(s) before trying again.`,
            };
        case 'cooldown_decline':
            return {
                title: 'Cooldown period',
                message: `This user recently declined a request. Wait ${retry ?? 90} more day(s) before trying again.`,
            };
        case 'blocked':
            return {
                title: 'Unable to send request',
                message: 'This request cannot be delivered.',
            };
        default:
            return {
                title: 'Something went wrong',
                message:
                    serverMsg ||
                    err?.message ||
                    'Could not send the connection request. Try again in a moment.',
            };
    }
}
