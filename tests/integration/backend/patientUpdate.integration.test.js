import request from 'supertest';
import { clearDatabase, closeDatabase, getApp, createTestUser } from '../../utils/helpers/backendHelper.js';
import Patient from '@backend/models/Patient.js';

const app = getApp();

describe('Patient Management — Update (BE-IT-42 to BE-IT-49)', () => {
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
        // Recreate baseline patient
        await request(app).post('/new-entry').set('Cookie', authCookieA).send({
            name: "John Doe", age: 45, examdate: "2026-06-03", allergies: "No", comorbidities: ["None"]
        });
    });

    afterAll(async () => {
        await closeDatabase();
    });

    it('BE-IT-42: Update Patient → Success', async () => {
        const res = await request(app)
            .put('/update/John%20Doe')
            .set('Cookie', authCookieA)
            .send({ name: "John Doe Updated", age: 46 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Clinical documentation updated successfully.");
        expect(res.body.data.name).toBe("John Doe Updated");
        expect(res.body.data.age).toBe(46);
    });

    it('BE-IT-43: Update Patient → Version Created', async () => {
        const res = await request(app)
            .put('/update/John%20Doe')
            .set('Cookie', authCookieA)
            .send({ chiefComplaints: "Updated complaints" });

        expect(res.status).toBe(200);
        const data = res.body.data;
        expect(data.versions.length).toBe(1);
        expect(data.versions[0].changeSummary).toContain("Chief Complaints");
    });

    it('BE-IT-44: Update Patient → Change Summary', async () => {
        const res = await request(app)
            .put('/update/John%20Doe')
            .set('Cookie', authCookieA)
            .send({ name: "John Doe Modified", age: 50, examination: "Normal" });

        expect(res.status).toBe(200);
        const data = res.body.data;
        expect(data.versions[0].changeSummary).toContain("Name");
        expect(data.versions[0].changeSummary).toContain("Age");
        expect(data.versions[0].changeSummary).toContain("Examination");
    });

    it('BE-IT-45: Update Patient → No Changes', async () => {
        // First get the exact patient data
        const getRes = await request(app).get('/patient/John%20Doe').set('Cookie', authCookieA);

        // Update with same data
        const res = await request(app)
            .put('/update/John%20Doe')
            .set('Cookie', authCookieA)
            .send(getRes.body);

        expect(res.status).toBe(200);
        expect(res.body.data.versions[0].changeSummary).toBe("Manual Update");
    });

    it('BE-IT-46: Update Patient → Non-existent', async () => {
        const res = await request(app)
            .put('/update/Nobody')
            .set('Cookie', authCookieA)
            .send({ age: 50 });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Patient record not found.");
    });

    it('BE-IT-47: Update Patient → Cross-user Isolation', async () => {
        // User B attempts to update User A's patient
        const res = await request(app)
            .put('/update/John%20Doe')
            .set('Cookie', authCookieB)
            .send({ age: 99 });

        expect(res.status).toBe(404);
    });

    it('BE-IT-48: Update Patient → Invalid Vitals', async () => {
        const res = await request(app)
            .put('/update/John%20Doe')
            .set('Cookie', authCookieA)
            .send({ vitals: { spO2: 200 } }); // spO2 max is 100

        expect(res.status).toBe(500);
    });

    it('BE-IT-49: Update Patient → Field Whitelist', async () => {
        const getRes = await request(app).get('/patient/John%20Doe').set('Cookie', authCookieA);
        const originalId = getRes.body._id;
        const originalUserId = getRes.body.userId;

        const res = await request(app)
            .put('/update/John%20Doe')
            .set('Cookie', authCookieA)
            .send({
                userId: "123456789012345678901234",
                _id: "123456789012345678901234",
                name: "Safe Name"
            });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe("Safe Name");
        expect(res.body.data._id).toBe(originalId);
        expect(res.body.data.userId).toBe(originalUserId);
    });
});
