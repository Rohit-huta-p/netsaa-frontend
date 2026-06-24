/**
 * Exercises the queryFn directly. Bypasses React Query to keep the test
 * focused on the two bits of real logic: response shape unwrapping and
 * hirerId === selfId filter.
 */
import { contractService } from '../../services/paymentService';
import { useAuthStore } from '../../stores/authStore';
import useContractsHirer from '../useContractsHirer';

jest.mock('../../services/paymentService', () => ({
  contractService: { getUserContracts: jest.fn() },
}));
jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Stub React Query wrapper — call queryFn directly.
jest.mock('@tanstack/react-query', () => ({
  useQuery: (opts: any) => ({ queryFnRef: opts.queryFn }),
}));

describe('useContractsHirer', () => {
  const SELF_ID = 'hirer-abc';

  beforeEach(() => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ user: { _id: SELF_ID } })
    );
  });

  it('returns [] when the backend response is empty', async () => {
    (contractService.getUserContracts as jest.Mock).mockResolvedValue([]);
    const result = (useContractsHirer() as any).queryFnRef;
    await expect(result()).resolves.toEqual([]);
  });

  it('filters out contracts where the caller is the artist (not the hirer)', async () => {
    (contractService.getUserContracts as jest.Mock).mockResolvedValue([
      { _id: 'c1', hirerId: SELF_ID, artistId: 'someone', status: 'active' },
      { _id: 'c2', hirerId: 'other-hirer', artistId: SELF_ID, status: 'active' },
    ]);
    const result = (useContractsHirer() as any).queryFnRef;
    const rows = await result();
    expect(rows).toHaveLength(1);
    expect(rows[0]._id).toBe('c1');
  });

  it('unwraps the { contracts: [...] } wrapper shape', async () => {
    (contractService.getUserContracts as jest.Mock).mockResolvedValue({
      contracts: [
        { _id: 'c1', hirerId: SELF_ID, status: 'pending_artist_signature' },
      ],
      total: 1,
    });
    const result = (useContractsHirer() as any).queryFnRef;
    const rows = await result();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('pending_artist_signature');
  });
});
