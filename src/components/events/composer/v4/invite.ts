/**
 * Pure builders for the invite sheet (spec C3 / frames 01a-01b).
 *
 * NETSA never sends anything itself — these just build the text + deep-link URLs
 * the host hands to WhatsApp / Messages / clipboard. Kept pure (no RN imports) so
 * the deep-link quirks are unit-tested.
 *
 * LINK (Q6, Phase 3): a per-event invite link with a join token
 * (netsa.app/events/<id>?invite=<token>) doesn't exist yet — and at compose time
 * the event isn't even created. So today we share a join-NETSA link; once the
 * person joins, the host links them from Manage. Swap INVITE_LINK for the
 * tokenised event URL when Q6 lands.
 */

export const INVITE_LINK = 'https://netsaa.com';

/** First word of a display name, for "Invite <first name>". Falls back to the whole string. */
export function inviteFirstName(displayName: string): string {
  return (displayName || '').trim().split(/\s+/)[0] || (displayName || '').trim();
}

/** The message a host shares. Warm, honest, and carries the join link. */
export function buildInviteMessage(firstName: string, link: string = INVITE_LINK): string {
  const who = firstName.trim() || 'there';
  return `Hi ${who}! I'm putting on an event and I'd love to feature you. Join me on NETSA so it links to your profile: ${link}`;
}

/** WhatsApp app deep-link (opens the contact picker with the text pre-filled). */
export function whatsappAppUrl(text: string): string {
  return `whatsapp://send?text=${encodeURIComponent(text)}`;
}

/** WhatsApp web fallback (works with or without the app installed). */
export function whatsappWebUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * SMS compose deep-link with a pre-filled body and no recipient.
 * Platform quirk (spec): iOS uses `sms:&body=`, Android uses `sms:?body=`.
 */
export function smsUrl(isIOS: boolean, body: string): string {
  const sep = isIOS ? '&' : '?';
  return `sms:${sep}body=${encodeURIComponent(body)}`;
}
