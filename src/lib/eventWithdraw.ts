/**
 * Pure helpers for the attendee "Withdraw" action on approval-gated event
 * registrations.
 *
 * Two pre-payment states can be withdrawn by the attendee themselves:
 *   - `pending`  — a request-to-join / apply that the host hasn't decided yet
 *                  (holds no seat, no money moved).
 *   - `approved` — a paid request the host approved; it holds a seat via a 48h
 *                  Razorpay hold, but nothing has been captured yet.
 *
 * Because both are pre-payment, withdrawing NEVER produces a refund. The confirm
 * copy is "pay-as-fact": it states plainly that no charge was made, so it can't
 * be mistaken for the refund-bearing cancellation of a confirmed ticket.
 *
 * The confirmed/registered cancel path is deliberately NOT handled here — that
 * one may refund and keeps its own CancellationReasonModal.
 */
export type WithdrawableStatus = 'pending' | 'approved';

/** A registration status the attendee may withdraw themselves (pre-payment). */
export function isWithdrawable(status: string | undefined): status is WithdrawableStatus {
  return status === 'pending' || status === 'approved';
}

/** Confirm-dialog copy. No language that implies money is coming back. */
export function withdrawConfirmCopy(status: WithdrawableStatus): { title: string; body: string } {
  return {
    title: 'Withdraw your request?',
    body:
      status === 'approved'
        ? 'This releases the seat being held for you. No payment was taken, so there is nothing to refund.'
        : 'This removes your request to join. You can request again while spots remain.',
  };
}
