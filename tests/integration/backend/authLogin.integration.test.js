import request from 'supertest';
import { clearDatabase, closeDatabase, getApp } from '../../utils/helpers/backendHelper.js';
import User from '@backend/models/User.js';
import jwt from 'jsonwebtoken';

const app = getApp();

describe('Authentication — Login (BE-IT-08 to BE-IT-15)', () => {
    const validSignupData = {
        fullName: "Dr. Jane",
        email: "jane@clinic.com",
        username: "janedoc",
        password: "Secure@123",
        phoneNumber: "9876543210"
    };

    let randomIp;

    beforeEach(async () => {
        randomIp = `192.168.3.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        await clearDatabase();
        await request(app).post('/signup').set('X-Forwarded-For', randomIp).send(validSignupData);
    });

    afterAll(async () => {
        await closeDatabase();
    });

    it('BE-IT-08: Login → Success with Username', async () => {
        const res = await request(app).post('/login').set('X-Forwarded-For', randomIp).send({
            username: "janedoc",
            password: "Secure@123"
        });

        expect(res.status).toBe(200);
        expect(res.body.authenticated).toBe(true);
        expect(res.headers['set-cookie']).toBeDefined();
        const cookie = res.headers['set-cookie'][0];
        expect(cookie).toContain('token=');
        expect(cookie).toContain('HttpOnly');
    });

    it('BE-IT-09: Login → Success with Email', async () => {
        const res = await request(app).post('/login').set('X-Forwarded-For', randomIp).send({
            username: "jane@clinic.com",
            password: "Secure@123"
        });

        expect(res.status).toBe(200);
        expect(res.body.authenticated).toBe(true);
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('BE-IT-10: Login → Success with Phone', async () => {
        const res = await request(app).post('/login').set('X-Forwarded-For', randomIp).send({
            username: "9876543210",
            password: "Secure@123"
        });

        expect(res.status).toBe(200);
        expect(res.body.authenticated).toBe(true);
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('BE-IT-11: Login → Wrong Password', async () => {
        const res = await request(app).post('/login').set('X-Forwarded-For', randomIp).send({
            username: "janedoc",
            password: "WrongPassword"
        });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Incorrect password. Please try again.");
        expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('BE-IT-12: Login → Non-existent User', async () => {
        const res = await request(app).post('/login').set('X-Forwarded-For', randomIp).send({
            username: "nobody",
            password: "Secure@123"
        });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid credentials. Please verify your username/email.");
    });

    it('BE-IT-13: Login → Missing Credentials', async () => {
        const res = await request(app).post('/login').set('X-Forwarded-For', randomIp).send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Username and password are required.");
    });

    it('BE-IT-14: Login → Deactivated Account', async () => {
        await User.updateOne({ username: "janedoc" }, { status: "deactivated" });

        const res = await request(app).post('/login').set('X-Forwarded-For', randomIp).send({
            username: "janedoc",
            password: "Secure@123"
        });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe("This account has been deactivated. Please contact support for assistance.");
    });

    it('BE-IT-15: Login → JWT Payload Correct', async () => {
        const res = await request(app).post('/login').set('X-Forwarded-For', randomIp).send({
            username: "janedoc",
            password: "Secure@123"
        });

        const cookieStr = res.headers['set-cookie'][0];
        const tokenMatch = cookieStr.match(/token=([^;]+)/);
        expect(tokenMatch).not.toBeNull();
        const token = tokenMatch[1];

        const decoded = jwt.decode(token);
        expect(decoded).not.toBeNull();
        expect(decoded.username).toBe("janedoc");
        expect(decoded.email).toBe("jane@clinic.com");
        expect(decoded.role).toBe("visitor");
        expect(decoded.id).toBeDefined();
        expect(decoded.exp).toBeDefined();
    });
});
