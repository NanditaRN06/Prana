import request from 'supertest';
import { clearDatabase, closeDatabase, getApp, createTestUser, getTestUserId } from '../../utils/helpers/backendHelper.js';
import Patient from '@backend/models/Patient.js';

const app = getApp();

describe('Patient Management — Create (BE-IT-30 to BE-IT-36)', () => {
    let authCookie;
    let authCookieB;
    let userIdA;

    beforeAll(async () => {
        await clearDatabase();
        const userA = await createTestUser({
            fullName: "Dr. Jane", email: "jane@clinic.com", username: "userA", password: "Secure@123"
        });
        authCookie = userA.cookie;
        userIdA = await getTestUserId("userA");

        const userB = await createTestUser({
            fullName: "Dr. Bob", email: "bob@clinic.com", username: "userB", password: "Secure@123"
        });
        authCookieB = userB.cookie;
    });

    beforeEach(async () => {
        await Patient.deleteMany({});
    });

    afterAll(async () => {
        await closeDatabase();
    });

    const validPatient = {
        name: "John Doe",
        age: 45,
        phone: "9876543210",
        examdate: "2026-06-03T10:00:00.000Z",
        allergies: "No",
        comorbidities: ["None"]
    };

    it('BE-IT-30: Create Patient → Success', async () => {
        const res = await request(app)
            .post('/new-entry')
            .set('Cookie', authCookie)
            .send(validPatient);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Patient clinical record successfully archived.");

        const patientInDb = await Patient.findOne({ name: "John Doe" });
        expect(patientInDb).not.toBeNull();
        expect(patientInDb.userId.toString()).toBe(userIdA);
    });

    it('BE-IT-31: Create Patient → Full Data', async () => {
        const fullPatient = {
            ...validPatient,
            vitals: { pulse: 75, bp: { systolic: 120, diastolic: 80 }, spO2: 98 },
            comorbidityData: [{ name: "Diabetes", duration: "5 years" }],
            investigationDetails: { ct: [{ region: "Head", contrast: "Yes" }] },
            treatments: ["Rest", "Hydration"]
        };

        const res = await request(app)
            .post('/new-entry')
            .set('Cookie', authCookie)
            .send(fullPatient);

        expect(res.status).toBe(201);
        const patientInDb = await Patient.findOne({ name: "John Doe" });
        expect(patientInDb.vitals.pulse).toBe(75);
        expect(patientInDb.treatments[0]).toBe("Rest");
    });

    it('BE-IT-32: Create Patient → Invalid Vitals', async () => {
        const invalidVitalsPatient = {
            ...validPatient,
            vitals: { pulse: 999 } // out of range
        };

        const res = await request(app)
            .post('/new-entry')
            .set('Cookie', authCookie)
            .send(invalidVitalsPatient);

        expect(res.status).toBe(500);
        // Error from Zod validator
    });

    it('BE-IT-33: Create Patient → Missing Required Field', async () => {
        const { name, ...missingNamePatient } = validPatient;

        const res = await request(app)
            .post('/new-entry')
            .set('Cookie', authCookie)
            .send(missingNamePatient);

        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Error archiving patient data. Please try again.");
    });

    it('BE-IT-34: Create Patient → Invalid Phone', async () => {
        const invalidPhonePatient = { ...validPatient, phone: "123" };

        const res = await request(app)
            .post('/new-entry')
            .set('Cookie', authCookie)
            .send(invalidPhonePatient);

        expect(res.status).toBe(500);
    });

    it('BE-IT-35: Create Patient → Negative Age', async () => {
        const negativeAgePatient = { ...validPatient, age: -5 };

        const res = await request(app)
            .post('/new-entry')
            .set('Cookie', authCookie)
            .send(negativeAgePatient);

        expect(res.status).toBe(500);
    });

    it('BE-IT-36: Create Patient → Ownership', async () => {
        // User A creates patient
        await request(app)
            .post('/new-entry')
            .set('Cookie', authCookie)
            .send(validPatient);

        const patientInDb = await Patient.findOne({ name: "John Doe" });
        expect(patientInDb.userId.toString()).toBe(userIdA);
    });
});
