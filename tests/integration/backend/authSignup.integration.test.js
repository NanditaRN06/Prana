import request from 'supertest';
import { clearDatabase, closeDatabase, getApp } from '../../utils/helpers/backendHelper.js';
import User from '@backend/models/User.js';

const app = getApp();

describe('Authentication — Signup (BE-IT-01 to BE-IT-07)', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    const validSignupData = {
        fullName: "Dr. Jane",
        email: "jane@clinic.com",
        username: "janedoc",
        password: "Secure@123",
        phoneNumber: "9876543210" // changed to 10-digit to pass mongoose custom validation
    };

    const getIp = () => `192.168.2.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    it('BE-IT-01: Signup → Success', async () => {
        const res = await request(app).post('/signup').set('X-Forwarded-For', getIp()).send(validSignupData);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Registration successful.");
        expect(res.body.user).toHaveProperty("id");
        expect(res.body.user.username).toBe("janedoc");

        const userInDb = await User.findOne({ username: "janedoc" });
        expect(userInDb).not.toBeNull();
    });

    it('BE-IT-02: Signup → Duplicate Email', async () => {
        await request(app).post('/signup').set('X-Forwarded-For', getIp()).send(validSignupData);

        const duplicateEmailData = { ...validSignupData, username: "different" };
        const res = await request(app).post('/signup').set('X-Forwarded-For', getIp()).send(duplicateEmailData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Email address is already registered.");
    });

    it('BE-IT-03: Signup → Duplicate Username', async () => {
        await request(app).post('/signup').set('X-Forwarded-For', getIp()).send(validSignupData);

        const duplicateUsernameData = { ...validSignupData, email: "different@clinic.com" };
        const res = await request(app).post('/signup').set('X-Forwarded-For', getIp()).send(duplicateUsernameData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Username is already taken.");
    });

    it('BE-IT-04: Signup → Duplicate Phone', async () => {
        await request(app).post('/signup').set('X-Forwarded-For', getIp()).send(validSignupData);

        const duplicatePhoneData = {
            ...validSignupData,
            email: "different@clinic.com",
            username: "different"
        };
        const res = await request(app).post('/signup').set('X-Forwarded-For', getIp()).send(duplicatePhoneData);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Phone number is already registered.");
    });

    it('BE-IT-05: Signup → Empty Phone', async () => {
        const emptyPhoneData = { ...validSignupData, phoneNumber: "" };
        const res = await request(app).post('/signup').set('X-Forwarded-For', getIp()).send(emptyPhoneData);

        expect(res.status).toBe(201);
        const userInDb = await User.findOne({ username: "janedoc" });
        expect(userInDb.phoneNumber).toBeUndefined();
    });

    it('BE-IT-06: Signup → Missing Required Fields', async () => {
        const missingData = { email: "a@b.com" };
        const res = await request(app).post('/signup').set('X-Forwarded-For', getIp()).send(missingData);

        expect(res.status).toBe(500);
        expect(res.body.message).toBe("An internal server error occurred. Please try again later.");
    });

    it('BE-IT-07: Signup → Password Hashed', async () => {
        await request(app).post('/signup').set('X-Forwarded-For', getIp()).send(validSignupData);

        const userInDb = await User.findOne({ username: "janedoc" });
        expect(userInDb.password).not.toBe(validSignupData.password);
        expect(userInDb.password.startsWith('$2')).toBe(true); // bcrypt prefix
    });
});
