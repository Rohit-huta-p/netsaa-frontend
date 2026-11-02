import { isWithdrawable, withdrawConfirmCopy } from '../eventWithdraw';

describe('isWithdrawable', () => {
  it('allows the two pre-payment states', () => {
    expect(isWithdrawable('pending')).toBe(true);
    expect(isWithdrawable('approved')).toBe(true);
  });

  it('rejects confirmed, terminal and unknown states', () => {
    // A confirmed ticket keeps its own refund-bearing cancel path, not withdraw.
    expect(isWithdrawable('registered')).toBe(false);
    expect(isWithdrawable('attended')).toBe(false);
    expect(isWithdrawable('no-show')).toBe(false);
    expect(isWithdrawable('declined')).toBe(false);
    expect(isWithdrawable('cancelled')).toBe(false);
    expect(isWithdrawable(undefined)).toBe(false);
    expect(isWithdrawable('')).toBe(false);
  });
});

describe('withdrawConfirmCopy', () => {
  it('uses the same request-framed title for both', () => {
    expect(withdrawConfirmCopy('pending').title).toBe('Withdraw your request?');
    expect(withdrawConfirmCopy('approved').title).toBe('Withdraw your request?');
  });

  it('never promises a refund (pay-as-fact)', () => {
    // Pending: no seat held, no money, so no refund wording at all.
    const pending = withdrawConfirmCopy('pending').body;
    expect(pending).not.toMatch(/refund/i);
    expect(pending).toContain('request again');

    // Approved: a seat is released; it must say no charge happened, not "you'll
    // be refunded". The only allowed mention of refund is to deny one.
    const approved = withdrawConfirmCopy('approved').body;
    expect(approved).toContain('releases the seat');
    expect(approved).toContain('nothing to refund');
    expect(approved).not.toMatch(/you.?ll be refunded|refund will|refunded to/i);
  });
});
