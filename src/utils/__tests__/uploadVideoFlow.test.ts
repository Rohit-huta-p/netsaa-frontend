jest.mock('../../services/mediaService', () => ({
  __esModule: true,
  default: { requestVideoUpload: jest.fn().mockResolvedValue({ success: true, data: { uploadId: 'up_x', uploadUrl: 'https://mux/put' } }) },
}));
global.fetch = jest.fn()
  .mockResolvedValueOnce({ blob: async () => new Blob(['x']) } as any) // read local file
  .mockResolvedValueOnce({ ok: true } as any);                          // PUT to Mux

import { uploadVideoFlow } from '../upload';

it('presigns via media-service then PUTs the file to Mux', async () => {
  const res = await uploadVideoFlow({ asset: { uri: 'file://v.mp4', mimeType: 'video/mp4' } as any, entityType: 'event', entityId: 'e1', purpose: 'gallery' });
  expect(res).toEqual({ success: true, uploadId: 'up_x' });
});

it('accepts a user+portfolio profile reel upload', async () => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ blob: async () => new Blob(['x']) } as any)
    .mockResolvedValueOnce({ ok: true } as any);
  const res = await uploadVideoFlow({ asset: { uri: 'file://r.mp4', mimeType: 'video/mp4' } as any, entityType: 'user', entityId: 'u1', purpose: 'portfolio' });
  expect(res).toEqual({ success: true, uploadId: 'up_x' });
});
