import request from 'supertest';
import { clearDatabase, closeDatabase, getApp, createTestUser } from '../../utils/helpers/backendHelper.js';

const app = getApp();

describe('Authentication — Logout (BE-IT-24 to BE-IT-25)', () => {
    let authCookie;

    beforeAll(async () => {
        await clearDatabase();
        const userResult = await createTestUser({
            fullName: "Dr. Jane",
            email: "jane@clinic.com",
            username: "janedoc",
            password: "Secure@123"
        });
        authCookie = userResult.cookie;
    });

    afterAll(async () => {
        await closeDatabase();
    });

    it('BE-IT-24: Logout → Cookie Cleared', async () => {
        const res = await request(app)
            .post('/logout')
            .set('Cookie', authCookie);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Session successfully terminated.");

        // Cookie should be cleared
        expect(res.headers['set-cookie']).toBeDefined();
        const cookie = res.headers['set-cookie'][0];
        expect(cookie).toContain('token=;'); // Indicates clearing
    });

    it('BE-IT-25: Logout → Without Cookie', async () => {
        const res = await request(app).post('/logout');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Session successfully terminated.");

        // Should still attempt to clear cookie
        expect(res.headers['set-cookie']).toBeDefined();
    });
});
