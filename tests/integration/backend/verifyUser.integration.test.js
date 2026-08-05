import request from 'supertest';
import { clearDatabase, closeDatabase, getApp, createTestUser } from '../../utils/helpers/backendHelper.js';
import jwt from 'jsonwebtoken';

const app = getApp();

describe('Authentication Middleware (BE-IT-26 to BE-IT-29)', () => {
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

    it('BE-IT-26: No Token → 401', async () => {
        const res = await request(app).get('/api/account');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Missing token");
    });

    it('BE-IT-27: Invalid Token → 401', async () => {
        const res = await request(app)
            .get('/api/account')
            .set('Cookie', ['token=invalidGarbage']);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid or expired token");
    });

    it('BE-IT-28: Expired Token → 401', async () => {
        // Create an expired token manually
        const expiredToken = jwt.sign({ id: "123", username: "test" }, process.env.JWT_SECRET, { expiresIn: "-1h" });

        const res = await request(app)
            .get('/api/account')
            .set('Cookie', [`token=${expiredToken}`]);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid or expired token");
    });

    it('BE-IT-29: Valid Token → Passes', async () => {
        const res = await request(app)
            .get('/api/account')
            .set('Cookie', authCookie);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("username", "janedoc");
    });
});
