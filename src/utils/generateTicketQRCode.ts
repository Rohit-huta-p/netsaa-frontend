import * as QRCode from 'qrcode';

/**
 * Payload for generating a ticket QR code.
 */
export interface TicketQRPayload {
    ticketId: string;
    eventId: string;
    userId: string;
}

/**
 * Generates a base64-encoded QR code image from a ticket payload.
 *
 * @param payload - The ticket data to encode (ticketId, eventId, userId).
 * @returns A base64 data-URL string (e.g. `data:image/png;base64,...`).
 * @throws If payload validation fails or QR generation encounters an error.
 *
 * @example
 * ```ts
 * import { generateTicketQRCode } from '@/utils/generateTicketQRCode';
 *
 * const qrDataUrl = await generateTicketQRCode({
 *     ticketId: '6601abc123',
 *     eventId: '6601def456',
 *     userId: '6601ghi789',
 * });
 *
 * // Use in an <Image /> component:
 * <Image source={{ uri: qrDataUrl }} style={{ width: 200, height: 200 }} />
 * ```
 */
export async function generateTicketQRCode(
    payload: TicketQRPayload,
): Promise<string> {
    // ── Validate ──
    const { ticketId, eventId, userId } = payload;

    if (!ticketId || !eventId || !userId) {
        throw new Error(
            '[generateTicketQRCode] Missing required fields: ticketId, eventId, and userId are all required.',
        );
    }

    // ── Generate ──
    try {
        const jsonData = JSON.stringify({ ticketId, eventId, userId });

        const base64 = await QRCode.toDataURL(jsonData, {
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        return base64;
    } catch (err) {
        const message =
            err instanceof Error ? err.message : 'Unknown error';
        throw new Error(
            `[generateTicketQRCode] Failed to generate QR code: ${message}`,
        );
    }
}
