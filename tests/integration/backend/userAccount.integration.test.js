import request from 'supertest';
import { clearDatabase, closeDatabase, getApp, createTestUser } from '../../utils/helpers/backendHelper.js';
import User from '@backend/models/User.js';

const app = getApp();

describe('User Account Management (BE-IT-61 to BE-IT-73)', () => {
    let authCookie;

    beforeAll(async () => {
        await clearDatabase();
    });

    beforeEach(async () => {
        await User.deleteMany({});
        const userResult = await createTestUser({
            fullName: "Dr. Jane",
            email: "jane@clinic.com",
            username: "janedoc",
            password: "Secure@123",
            phoneNumber: "9876543210"
        });
        authCookie = userResult.cookie;
    });

    afterAll(async () => {
        await closeDatabase();
    });

    // --- GET ACCOUNT ---

    it('BE-IT-61: Get Account → Success', async () => {
        const res = await request(app).get('/api/account').set('Cookie', authCookie);
        expect(res.status).toBe(200);
        expect(res.body.username).toBe("janedoc");
    });

    it('BE-IT-62: Get Account → No Password Leak', async () => {
        const res = await request(app).get('/api/account').set('Cookie', authCookie);
        expect(res.status).toBe(200);
        expect(res.body.password).toBeUndefined();
    });

    // --- UPDATE ACCOUNT ---

    it('BE-IT-63: Update Account → Success', async () => {
        const res = await request(app).put('/api/account').set('Cookie', authCookie).send({
            fullName: "Dr. Jane Updated",
            department: "Neurosurgery"
        });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Profile updated successfully");
        expect(res.body.user.fullName).toBe("Dr. Jane Updated");
        expect(res.body.user.department).toBe("Neurosurgery");
    });

    it('BE-IT-64: Update Account → KMC Number', async () => {
        const res = await request(app).put('/api/account').set('Cookie', authCookie).send({
            kmcNumber: "KMC12345"
        });

        expect(res.status).toBe(200);
        expect(res.body.user.kmcNumber).toBe("KMC12345");
    });

    it('BE-IT-65: Update Account → Duplicate KMC', async () => {
        // Create another user with KMC
        const userB = await createTestUser({
            fullName: "Dr. Bob", email: "bob@clinic.com", username: "bobdoc", password: "Secure@123"
        });
        await request(app).put('/api/account').set('Cookie', userB.cookie).send({ kmcNumber: "KMC12345" });

        // Attempt to claim same KMC
        const res = await request(app).put('/api/account').set('Cookie', authCookie).send({
            kmcNumber: "KMC12345"
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("This KMC Number is already registered.");
    });

    it('BE-IT-66: Update Account → Clear Phone', async () => {
        const res = await request(app).put('/api/account').set('Cookie', authCookie).send({
            phoneNumber: ""
        });

        expect(res.status).toBe(200);

        // Verify in DB
        const userInDb = await User.findOne({ username: "janedoc" });
        expect(userInDb.phoneNumber).toBeUndefined();
    });

    it('BE-IT-67: Update Account → Clear KMC', async () => {
        // Set first
        await request(app).put('/api/account').set('Cookie', authCookie).send({ kmcNumber: "KMC123" });

        // Clear it
        const res = await request(app).put('/api/account').set('Cookie', authCookie).send({
            kmcNumber: ""
        });

        expect(res.status).toBe(200);
        const userInDb = await User.findOne({ username: "janedoc" });
        expect(userInDb.kmcNumber).toBeUndefined();
    });

    it('BE-IT-68: Update Account → Qualifications Array', async () => {
        const res = await request(app).put('/api/account').set('Cookie', authCookie).send({
            qualifications: ["MD", "DM Neurology"]
        });

        expect(res.status).toBe(200);
        expect(res.body.user.qualifications).toEqual(["MD", "DM Neurology"]);
    });

    it('BE-IT-69: Update Account → Partial Update', async () => {
        const res = await request(app).put('/api/account').set('Cookie', authCookie).send({
            department: "Cardiology"
        });

        expect(res.status).toBe(200);
        expect(res.body.user.department).toBe("Cardiology");
        expect(res.body.user.fullName).toBe("Dr. Jane"); // Unchanged
    });

    // --- DELETE ACCOUNT ---

    it('BE-IT-70: Delete Account → Success', async () => {
        const res = await request(app).delete('/api/account').set('Cookie', authCookie);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Account deleted successfully");

        const userInDb = await User.findOne({ username: "janedoc" });
        expect(userInDb).toBeNull();
    });

    it('BE-IT-71: Delete Account → User Not Found', async () => {
        // Manually delete first
        await User.deleteOne({ username: "janedoc" });

        const res = await request(app).delete('/api/account').set('Cookie', authCookie);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("User not found");
    });

    // --- DEACTIVATE ACCOUNT ---

    it('BE-IT-72: Deactivate Account → Success', async () => {
        const res = await request(app).post('/api/deactivate').set('Cookie', authCookie);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Account deactivated successfully.");

        const userInDb = await User.findOne({ username: "janedoc" });
        expect(userInDb.status).toBe("deactivated");
    });

    it('BE-IT-73: Deactivate → Login Blocked', async () => {
        await request(app).post('/api/deactivate').set('Cookie', authCookie);

        const res = await request(app).post('/login').send({
            username: "janedoc",
            password: "Secure@123"
        });

        expect(res.status).toBe(403);
        expect(res.body.message).toContain("deactivated");
    });
});
