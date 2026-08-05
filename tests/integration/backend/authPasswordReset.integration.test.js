import request from 'supertest';
import { clearDatabase, closeDatabase, getApp, mockNodemailer } from '../../utils/helpers/backendHelper.js';
import User from '@backend/models/User.js';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

const app = getApp();

describe('Authentication — Password Reset (BE-IT-16 to BE-IT-23)', () => {
    let sendMailMock;
    let userId;

    const validSignupData = {
        fullName: "Dr. Jane",
        email: "jane@clinic.com",
        username: "janedoc",
        password: "Secure@123"
    };

    const getIp = () => `192.168.4.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    beforeAll(() => {
        sendMailMock = mockNodemailer();
    });

    beforeEach(async () => {
        await clearDatabase();
        sendMailMock.mockClear();
        await request(app).post('/signup').set('X-Forwarded-For', getIp()).send(validSignupData);
        const user = await User.findOne({ username: "janedoc" });
        userId = user._id.toString();
    });

    afterAll(async () => {
        jest.restoreAllMocks();
        await closeDatabase();
    });

    const getValidToken = async () => {
        const user = await User.findById(userId);
        const secret = process.env.JWT_SECRET + user.password;
        return jwt.sign({ id: user._id.toString() }, secret, { expiresIn: "15m" });
    };

    it('BE-IT-16: Forgot Password → Email Sent', async () => {
        const res = await request(app).post('/forgot-password').set('X-Forwarded-For', getIp()).send({
            contact: "jane@clinic.com"
        });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("If this email is registered, a professional recovery link has been dispatched.");
        expect(sendMailMock).toHaveBeenCalledTimes(1);
        expect(sendMailMock.mock.calls[0][0].to).toBe("jane@clinic.com");
    });

    it('BE-IT-17: Forgot Password → Non-existent Email', async () => {
        const res = await request(app).post('/forgot-password').set('X-Forwarded-For', getIp()).send({
            contact: "unknown@clinic.com"
        });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("If this email is registered, a professional recovery link has been dispatched.");
        expect(sendMailMock).toHaveBeenCalledTimes(0);
    });

    it('BE-IT-18: Verify Token → Valid', async () => {
        const token = await getValidToken();
        const res = await request(app).get(`/reset-password-verify?id=${userId}&token=${token}`);

        expect(res.status).toBe(200);
        expect(res.body.valid).toBe(true);
    });

    it('BE-IT-19: Verify Token → Invalid Token', async () => {
        const res = await request(app).get(`/reset-password-verify?id=${userId}&token=badtoken`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Security token is invalid or has already been used.");
    });

    it('BE-IT-20: Verify Token → Non-existent User', async () => {
        const token = await getValidToken();
        const fakeId = new User()._id.toString();
        const res = await request(app).get(`/reset-password-verify?id=${fakeId}&token=${token}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Security parameters are invalid.");
    });

    it('BE-IT-21: Reset Password → Success', async () => {
        const token = await getValidToken();
        const newPassword = "NewSecure@123";

        const res = await request(app).post('/reset-password-action').set('X-Forwarded-For', getIp()).send({
            id: userId,
            token,
            newPassword
        });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Password updated successfully. You may now log in with your new credentials.");

        // Verify old password fails, new password works
        const oldLogin = await request(app).post('/login').set('X-Forwarded-For', getIp()).send({ username: "janedoc", password: "Secure@123" });
        expect(oldLogin.status).toBe(401);

        const newLogin = await request(app).post('/login').set('X-Forwarded-For', getIp()).send({ username: "janedoc", password: newPassword });
        expect(newLogin.status).toBe(200);
    });

    it('BE-IT-22: Reset Password → Token Invalidated After Use', async () => {
        const token = await getValidToken();
        const newPassword = "NewSecure@123";

        await request(app).post('/reset-password-action').set('X-Forwarded-For', getIp()).send({
            id: userId, token, newPassword
        });

        // Try to reuse the same token
        const res2 = await request(app).post('/reset-password-action').set('X-Forwarded-For', getIp()).send({
            id: userId, token, newPassword: "AnotherPassword123"
        });

        expect(res2.status).toBe(401);
    });

    it('BE-IT-23: Reset Password → Invalid Token', async () => {
        const res = await request(app).post('/reset-password-action').set('X-Forwarded-For', getIp()).send({
            id: userId,
            token: "tampered_token",
            newPassword: "X"
        });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Security token is invalid, expired, or has already been used.");
    });
});
