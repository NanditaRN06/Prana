import request from 'supertest';
import { clearDatabase, closeDatabase, getApp, mockNodemailer } from '../../utils/helpers/backendHelper.js';
import User from '@backend/models/User.js';
import { jest } from '@jest/globals';

const app = getApp();

describe('Cross-cutting — Multi-step Workflows (BE-IT-77 to BE-IT-80)', () => {
    let sendMailMock;

    const getIp = () => `192.168.5.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    beforeAll(async () => {
        sendMailMock = mockNodemailer();
    });

    beforeEach(async () => {
        await clearDatabase();
        sendMailMock.mockClear();
    });

    afterAll(async () => {
        jest.restoreAllMocks();
        await closeDatabase();
    });

    it('BE-IT-77: Full Lifecycle: Signup → Login → Create → Read → Update → Delete', async () => {
        // 1. Signup
        const signupRes = await request(app).post('/signup').set('X-Forwarded-For', getIp()).send({
            fullName: "Dr. Lifecycle", email: "life@clinic.com", username: "lifedoc", password: "Secure@123"
        });
        expect(signupRes.status).toBe(201);

        // 2. Login
        const loginRes = await request(app).post('/login').set('X-Forwarded-For', getIp()).send({
            username: "lifedoc", password: "Secure@123"
        });
        expect(loginRes.status).toBe(200);
        const cookie = loginRes.headers['set-cookie'];

        // 3. Create Patient
        const createRes = await request(app).post('/new-entry').set('Cookie', cookie).send({
            name: "Test Patient", age: 30, examdate: "2026-06-03", allergies: "No", comorbidities: ["None"]
        });
        expect(createRes.status).toBe(201);

        // 4. Read Patient
        const readRes = await request(app).get('/patient/Test%20Patient').set('Cookie', cookie);
        expect(readRes.status).toBe(200);
        expect(readRes.body.name).toBe("Test Patient");

        // 5. Update Patient
        const updateRes = await request(app).put('/update/Test%20Patient').set('Cookie', cookie).send({
            age: 31
        });
        expect(updateRes.status).toBe(200);

        // 6. Delete Patient
        const deleteRes = await request(app).delete('/patient/Test%20Patient').set('Cookie', cookie);
        expect(deleteRes.status).toBe(200);

        // Final Verify
        const finalRead = await request(app).get('/patient/Test%20Patient').set('Cookie', cookie);
        expect(finalRead.status).toBe(404);
    });

    it('BE-IT-78: Password Reset → Login with New Password', async () => {
        // Setup user
        await request(app).post('/signup').set('X-Forwarded-For', getIp()).send({
            fullName: "Dr. Reset", email: "reset@clinic.com", username: "resetdoc", password: "OldPassword@123"
        });
        const user = await User.findOne({ username: "resetdoc" });

        // Request reset
        await request(app).post('/forgot-password').set('X-Forwarded-For', getIp()).send({ contact: "reset@clinic.com" });
        expect(sendMailMock).toHaveBeenCalled();

        const mailContent = sendMailMock.mock.calls[0][0].html;
        const tokenMatch = mailContent.match(/token=([^"]+)/);
        expect(tokenMatch).not.toBeNull();
        const token = tokenMatch[1];

        // Perform reset
        await request(app).post('/reset-password-action').set('X-Forwarded-For', getIp()).send({
            id: user._id.toString(),
            token,
            newPassword: "NewPassword@123"
        });

        // Login with new
        const loginRes = await request(app).post('/login').set('X-Forwarded-For', getIp()).send({
            username: "resetdoc", password: "NewPassword@123"
        });
        expect(loginRes.status).toBe(200);
    });

    it('BE-IT-79: Deactivate → Attempt Login → Remains Blocked', async () => {
        // Setup
        await request(app).post('/signup').set('X-Forwarded-For', getIp()).send({
            fullName: "Dr. Deactivate", email: "deact@clinic.com", username: "deactdoc", password: "Secure@123"
        });
        const loginRes = await request(app).post('/login').set('X-Forwarded-For', getIp()).send({
            username: "deactdoc", password: "Secure@123"
        });
        const cookie = loginRes.headers['set-cookie'];

        // Deactivate
        const deactRes = await request(app).post('/api/deactivate').set('Cookie', cookie);
        expect(deactRes.status).toBe(200);

        // Try to login again
        const reLoginRes = await request(app).post('/login').set('X-Forwarded-For', getIp()).send({
            username: "deactdoc", password: "Secure@123"
        });
        expect(reLoginRes.status).toBe(403);
    });

    it('BE-IT-80: User Isolation End-to-End', async () => {
        // Setup users
        await request(app).post('/signup').set('X-Forwarded-For', getIp()).send({
            fullName: "Dr. A", email: "a@clinic.com", username: "userA", password: "Secure@123"
        });
        const loginA = await request(app).post('/login').set('X-Forwarded-For', getIp()).send({ username: "userA", password: "Secure@123" });
        const cookieA = loginA.headers['set-cookie'];

        await request(app).post('/signup').set('X-Forwarded-For', getIp()).send({
            fullName: "Dr. B", email: "b@clinic.com", username: "userB", password: "Secure@123"
        });
        const loginB = await request(app).post('/login').set('X-Forwarded-For', getIp()).send({ username: "userB", password: "Secure@123" });
        const cookieB = loginB.headers['set-cookie'];

        // A creates Alice, B creates Bob
        await request(app).post('/new-entry').set('Cookie', cookieA).send({
            name: "Alice", age: 30, examdate: "2026-06-03", allergies: "No", comorbidities: ["None"]
        });
        await request(app).post('/new-entry').set('Cookie', cookieB).send({
            name: "Bob", age: 40, examdate: "2026-06-03", allergies: "No", comorbidities: ["None"]
        });

        // Cross-searches
        const searchRes = await request(app).get('/api/search-patients?query=Bob').set('Cookie', cookieA);
        expect(searchRes.body).toEqual([]);

        // Cross-reads
        const readRes = await request(app).get('/patient/Alice').set('Cookie', cookieB);
        expect(readRes.status).toBe(404);
    });
});
