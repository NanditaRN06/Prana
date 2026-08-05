import request from 'supertest';
import { clearDatabase, closeDatabase, getApp, createTestUser } from '../../utils/helpers/backendHelper.js';

const app = getApp();

describe('Patient Management — Read (BE-IT-37 to BE-IT-41)', () => {
    let authCookieA;
    let authCookieB;

    beforeAll(async () => {
        await clearDatabase();
        const userA = await createTestUser({
            fullName: "Dr. A", email: "a@clinic.com", username: "userA", password: "Secure@123"
        });
        authCookieA = userA.cookie;

        const userB = await createTestUser({
            fullName: "Dr. B", email: "b@clinic.com", username: "userB", password: "Secure@123"
        });
        authCookieB = userB.cookie;

        // User A creates a patient
        await request(app).post('/new-entry').set('Cookie', authCookieA).send({
            name: "John Doe", age: 45, phone: "9876543210", examdate: "2026-06-03", allergies: "No", comorbidities: ["None"]
        });

        // User A creates another patient with special characters
        await request(app).post('/new-entry').set('Cookie', authCookieA).send({
            name: "O'Brien (Jr.)", age: 30, examdate: "2026-06-03", allergies: "No", comorbidities: ["None"]
        });
    });

    afterAll(async () => {
        await closeDatabase();
    });

    it('BE-IT-37: Get Patient → Success', async () => {
        const res = await request(app)
            .get('/patient/John%20Doe')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe("John Doe");
        expect(res.body.age).toBe(45);
    });

    it('BE-IT-38: Get Patient → Cross-user Isolation', async () => {
        // User B tries to read User A's patient
        const res = await request(app)
            .get('/patient/John%20Doe')
            .set('Cookie', authCookieB);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Clinical record not found for the specified patient.");
    });

    it('BE-IT-39: Get Patient → Non-existent', async () => {
        const res = await request(app)
            .get('/patient/Nobody')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(404);
    });

    it('BE-IT-40: Get Patient → Case Insensitive', async () => {
        const res = await request(app)
            .get('/patient/john%20doe')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe("John Doe"); // returns original case
    });

    it('BE-IT-41: Get Patient → Special Characters in Name', async () => {
        const res = await request(app)
            .get('/patient/O%27Brien%20(Jr.)')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe("O'Brien (Jr.)");
    });
});
