import request from 'supertest';
import { clearDatabase, closeDatabase, getApp, createTestUser } from '../../utils/helpers/backendHelper.js';
import Patient from '@backend/models/Patient.js';

const app = getApp();

describe('Patient Management — Delete (BE-IT-50 to BE-IT-52)', () => {
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
    });

    beforeEach(async () => {
        await Patient.deleteMany({});
        await request(app).post('/new-entry').set('Cookie', authCookieA).send({
            name: "John Doe", age: 45, examdate: "2026-06-03", allergies: "No", comorbidities: ["None"]
        });
    });

    afterAll(async () => {
        await closeDatabase();
    });

    it('BE-IT-50: Delete Patient → Success', async () => {
        const res = await request(app)
            .delete('/patient/John%20Doe')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Clinical patient record successfully purged from registry.");

        const patientInDb = await Patient.findOne({ name: "John Doe" });
        expect(patientInDb).toBeNull();
    });

    it('BE-IT-51: Delete Patient → Non-existent', async () => {
        const res = await request(app)
            .delete('/patient/Nobody')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Record not found for deletion.");
    });

    it('BE-IT-52: Delete Patient → Cross-user Isolation', async () => {
        // User B attempts to delete User A's patient
        const res = await request(app)
            .delete('/patient/John%20Doe')
            .set('Cookie', authCookieB);

        expect(res.status).toBe(404);

        // Ensure patient still exists
        const patientInDb = await Patient.findOne({ name: "John Doe" });
        expect(patientInDb).not.toBeNull();
    });
});
