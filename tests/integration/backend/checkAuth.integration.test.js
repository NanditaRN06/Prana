import request from 'supertest';
import { clearDatabase, closeDatabase, getApp, createTestUser } from '../../utils/helpers/backendHelper.js';

const app = getApp();

describe('Check Auth (BE-IT-74 to BE-IT-76)', () => {
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

    it('BE-IT-74: Check Auth → Authenticated', async () => {
        const res = await request(app)
            .get('/api/check-auth')
            .set('Cookie', authCookie);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Authenticated");
    });

    it('BE-IT-75: Check Auth → No Token', async () => {
        const res = await request(app).get('/api/check-auth');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Not authenticated");
    });

    it('BE-IT-76: Check Auth → Invalid Token', async () => {
        const res = await request(app)
            .get('/api/check-auth')
            .set('Cookie', ['token=garbage']);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid token");
    });
});
