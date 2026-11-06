import { interpretConnectionError } from '../connectionErrors';

const axiosErr = (data: any) => ({ response: { data } });

describe('interpretConnectionError', () => {
  it('swallows "not found" — the request is already gone, so the row should just drop', () => {
    expect(interpretConnectionError(axiosErr({ message: 'Connection request not found.' })).swallow).toBe(true);
  });

  it('swallows "already …" — already resolved on the server', () => {
    expect(
      interpretConnectionError(axiosErr({ message: 'Connection request already exists or you are already connected.' })).swallow
    ).toBe(true);
  });

  it('does NOT swallow a genuine, retryable error', () => {
    const info = interpretConnectionError(axiosErr({ message: 'Server exploded' }));
    expect(info.swallow).toBeFalsy();
    expect(info.title).toBe('Something went wrong');
  });

  it('maps the rate_limited code to a friendly, non-swallow message', () => {
    const info = interpretConnectionError(axiosErr({ code: 'rate_limited', retryAfterDays: 7 }));
    expect(info.swallow).toBeFalsy();
    expect(info.title).toBe('Weekly limit reached');
  });
});
