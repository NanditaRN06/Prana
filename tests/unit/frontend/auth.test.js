import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isAuthenticated, logout } from '@frontend/utils/auth';
import apiClient from '@frontend/services/apiClient';

vi.mock('@frontend/services/apiClient', () => {
    return {
        default: {
            get: vi.fn(),
            post: vi.fn(),
        }
    };
});

describe('auth utility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('FE-UT-30: isAuthenticated - API returns 200 → returns true', async () => {
        apiClient.get.mockResolvedValueOnce({ status: 200 });
        const result = await isAuthenticated();
        expect(apiClient.get).toHaveBeenCalledWith('/api/check-auth');
        expect(result).toBe(true);
    });

    it('FE-UT-31: isAuthenticated - API rejects → returns false', async () => {
        apiClient.get.mockRejectedValueOnce(new Error('Unauthorized'));
        const result = await isAuthenticated();
        expect(result).toBe(false);
    });

    it('FE-UT-32: logout - API returns 200 → returns true', async () => {
        apiClient.post.mockResolvedValueOnce({ status: 200 });
        const result = await logout();
        expect(apiClient.post).toHaveBeenCalledWith('/logout', {});
        expect(result).toBe(true);
    });

    it('FE-UT-33: logout - API fails → returns false', async () => {
        apiClient.post.mockRejectedValueOnce(new Error('Server error'));
        const result = await logout();
        expect(result).toBe(false);
    });
});
