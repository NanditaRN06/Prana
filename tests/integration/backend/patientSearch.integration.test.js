import request from 'supertest';
import { clearDatabase, closeDatabase, getApp, createTestUser } from '../../utils/helpers/backendHelper.js';
import Patient from '@backend/models/Patient.js';

const app = getApp();

describe('Patient Management — Search (BE-IT-53 to BE-IT-60)', () => {
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

        // Create patients for User A
        await request(app).post('/new-entry').set('Cookie', authCookieA).send({
            name: "John Doe", age: 45, phone: "9876543210", examdate: "2026-06-03", allergies: "No", comorbidities: ["None"]
        });
        await request(app).post('/new-entry').set('Cookie', authCookieA).send({
            name: "Alice Smith", age: 30, examdate: "2026-06-03", allergies: "No", comorbidities: ["Hypertension"],
            clinicalDiagnosis: "Migraine with aura", chiefComplaints: "Severe headache"
        });
        await request(app).post('/new-entry').set('Cookie', authCookieA).send({
            name: "O'Brien (Jr.)", age: 50, examdate: "2026-06-03", allergies: "No", comorbidities: ["None"]
        });

        // Create patient for User B
        await request(app).post('/new-entry').set('Cookie', authCookieB).send({
            name: "Bob Jones", age: 40, examdate: "2026-06-03", allergies: "No", comorbidities: ["None"]
        });
    });

    afterAll(async () => {
        await closeDatabase();
    });

    it('BE-IT-53: Search → By Name', async () => {
        const res = await request(app)
            .get('/api/search-patients?query=John')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe("John Doe");
    });

    it('BE-IT-54: Search → By Clinical Diagnosis', async () => {
        const res = await request(app)
            .get('/api/search-patients?query=Migraine')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe("Alice Smith");
    });

    it('BE-IT-55: Search → By Phone Number', async () => {
        const res = await request(app)
            .get('/api/search-patients?query=9876543210')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe("John Doe");
    });

    it('BE-IT-56: Search → No Results', async () => {
        const res = await request(app)
            .get('/api/search-patients?query=zzzznonexistent')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('BE-IT-57: Search → Cross-user Isolation', async () => {
        const res = await request(app)
            .get('/api/search-patients?query=Bob')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]); // Bob belongs to User B
    });

    it('BE-IT-58: Search → Missing Query', async () => {
        const res = await request(app)
            .get('/api/search-patients')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Search query is required.");
    });

    it('BE-IT-59: Search → Special Characters', async () => {
        const res = await request(app)
            .get('/api/search-patients?query=O\'Brien (Jr.)')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe("O'Brien (Jr.)");
    });

    it('BE-IT-60: Search → Multi-field Match', async () => {
        const res = await request(app)
            .get('/api/search-patients?query=headache')
            .set('Cookie', authCookieA);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1); // Alice Smith has "headache" in chiefComplaints
    });
});
