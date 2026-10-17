import {
  INVITE_LINK, inviteFirstName, buildInviteMessage,
  whatsappAppUrl, whatsappWebUrl, smsUrl,
} from '../invite';

describe('invite builders', () => {
  it('inviteFirstName takes the first word, with fallbacks', () => {
    expect(inviteFirstName('Anjali Menon')).toBe('Anjali');
    expect(inviteFirstName('Anjali')).toBe('Anjali');
    expect(inviteFirstName('  Ravi   Kumar ')).toBe('Ravi');
    expect(inviteFirstName('')).toBe('');
  });

  it('buildInviteMessage includes the name and the link', () => {
    const m = buildInviteMessage('Anjali');
    expect(m).toContain('Anjali');
    expect(m).toContain(INVITE_LINK);
  });

  it('buildInviteMessage falls back to "there" for an empty name', () => {
    expect(buildInviteMessage('')).toContain('Hi there!');
  });

  it('whatsapp URLs encode the text', () => {
    const text = 'Hi Anjali! join: https://netsaa.com';
    expect(whatsappAppUrl(text)).toBe(`whatsapp://send?text=${encodeURIComponent(text)}`);
    expect(whatsappWebUrl(text)).toBe(`https://wa.me/?text=${encodeURIComponent(text)}`);
  });

  it('smsUrl uses the platform separator quirk (iOS &, Android ?)', () => {
    expect(smsUrl(true, 'hello world')).toBe('sms:&body=hello%20world');
    expect(smsUrl(false, 'hello world')).toBe('sms:?body=hello%20world');
  });
});
