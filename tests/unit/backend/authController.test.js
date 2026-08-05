import { jest } from '@jest/globals';
import authController from '@backend/controllers/authController.js';
import authService from '@backend/services/authService.js';

describe('authController Unit Tests', () => {
    let req, res;

    let mockSignupUser;
    let mockLoginUser;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
            clearCookie: jest.fn()
        };
        jest.clearAllMocks();

        mockSignupUser = jest.spyOn(authService, 'signupUser');
        mockLoginUser = jest.spyOn(authService, 'loginUser');
        jest.spyOn(console, 'error').mockImplementation(() => { }); // Keeps logs clean
    });

    describe('signup', () => {
        it('BE-UT-01: Successful registration', async () => {
            req.body = { name: 'Test', email: 'test@example.com', password: 'pwd' };
            mockSignupUser.mockResolvedValue({ _id: '123', username: 'testuser' });

            await authController.signup(req, res);

            expect(mockSignupUser).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Registration successful."
            }));
        });

        it('BE-UT-02: Missing required fields', async () => {
            req.body = { email: 'test@example.com' };
            const error = new Error('User validation failed: password: Path `password` is required.');
            mockSignupUser.mockRejectedValue(error);

            await authController.signup(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('BE-UT-03: Duplicate unique fields', async () => {
            req.body = { email: 'a@b.com', password: 'pwd' };
            mockSignupUser.mockRejectedValue(new Error('Email address is already registered.'));

            await authController.signup(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Email address is already registered.'
            }));
        });

        it('BE-UT-24: Username already taken → 400', async () => {
            req.body = { email: 'new@b.com', username: 'taken', password: 'pwd' };
            mockSignupUser.mockRejectedValue(new Error('Username is already taken.'));

            await authController.signup(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Username is already taken.'
            }));
        });
    });

    it('BE-UT-49: Generic 500 catch (non-registration error)', async () => {
        req.body = { email: 'test@b.com', username: 'test', password: 'pwd' };
        mockSignupUser.mockRejectedValue(new Error('Database cluster failed'));

        await authController.signup(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'An internal server error occurred. Please try again later.'
        }));
    });

describe('login', () => {
    it('BE-UT-05: Successful login', async () => {
        req.body = { username: 'user', password: 'pwd' };
        mockLoginUser.mockResolvedValue('mock-jwt-token');

        await authController.login(req, res);

        expect(mockLoginUser).toHaveBeenCalledWith(req.body);
        expect(res.cookie).toHaveBeenCalledWith('token', 'mock-jwt-token', expect.any(Object));
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Login successful.",
            authenticated: true
        }));
    });

    it('BE-UT-07: Login to deactivated account', async () => {
        req.body = { username: 'deactivatedUser', password: 'pwd' };
        mockLoginUser.mockRejectedValue(new Error('This account has been deactivated.'));

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message: 'This account has been deactivated.'
        });
    });

    it('BE-UT-22: User not found → 401', async () => {
        req.body = { username: 'ghost', password: 'pwd' };
        mockLoginUser.mockRejectedValue(new Error('Invalid credentials. Please verify your username/email.'));

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials. Please verify your username/email.' });
    });

    it('BE-UT-08: Internal Server Error', async () => {
        req.body = { username: 'user', password: 'pwd' };
        mockLoginUser.mockRejectedValue(new Error('Database explosion'));

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Login failed due to a server error.' });
    });

    it('BE-UT-23: Server error -> 500', async () => {
        req.body = { username: 'user', password: 'pwd' };
        mockLoginUser.mockRejectedValue(new Error('Unknown service failure'));

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Login failed due to a server error.' });
    });

    it('BE-UT-46: Wrong credential format', async () => {
        req.body = null;
        await authController.login(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Username and password are required." });
    });
});

describe('forgotPassword', () => {
    it('BE-UT-13: Mailer service down', async () => {
        req.body = { contact: 'test@example.com' };
        jest.spyOn(authService, 'requestPasswordReset').mockRejectedValue(new Error('Mailer service down'));

        await authController.forgotPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "An unexpected error occurred during the password recovery process."
        }));
    });

    it('BE-UT-25: Returns generic 200 (email exists)', async () => {
        req.body = { contact: 'test@example.com' };
        jest.spyOn(authService, 'requestPasswordReset').mockResolvedValue(true);

        await authController.forgotPassword(req, res);

        expect(res.json).toHaveBeenCalledWith({ message: "If this email is registered, a professional recovery link has been dispatched.", type: "email" });
    });

    it('BE-UT-26: Anti-enumeration (email not found)', async () => {
        req.body = { contact: 'ghost@example.com' };
        jest.spyOn(authService, 'requestPasswordReset').mockResolvedValue(true);

        await authController.forgotPassword(req, res);

        expect(res.json).toHaveBeenCalledWith({ message: "If this email is registered, a professional recovery link has been dispatched.", type: "email" });
    });
});

describe('resetPasswordVerify', () => {
    it('BE-UT-15: Token verification', async () => {
        req.query = { id: '123', token: 'abc' };
        jest.spyOn(authService, 'verifyPasswordReset').mockResolvedValue(true);

        await authController.resetPasswordVerify(req, res);

        expect(res.json).toHaveBeenCalledWith({ valid: true });
    });

    it('BE-UT-16: Invalid token (401)', async () => {
        req.query = { id: '123', token: 'wrong' };
        jest.spyOn(authService, 'verifyPasswordReset').mockRejectedValue(new Error('Security parameters are invalid.'));

        await authController.resetPasswordVerify(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Security parameters are invalid.' });
    });

    it('BE-UT-17: User mismatch (403)', async () => {
        req.query = { id: 'UserB_ID', token: 'UserA_Tkn' };
        jest.spyOn(authService, 'verifyPasswordReset').mockRejectedValue(new Error('Unauthorized.'));

        await authController.resetPasswordVerify(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized.' });
    });

    it('BE-UT-27: Unknown error → fallback 401', async () => {
        req.query = { id: '123', token: 'abc' };
        jest.spyOn(authService, 'verifyPasswordReset').mockRejectedValue(new Error('Database Error'));

        await authController.resetPasswordVerify(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Security token is invalid or has already been used." });
    });
});

describe('resetPasswordAction', () => {
    it('BE-UT-18: Password update', async () => {
        req.body = { id: '123', token: 'abc', newPassword: 'newpwd' };
        jest.spyOn(authService, 'resetPassword').mockResolvedValue(true);

        await authController.resetPasswordAction(req, res);

        expect(res.json).toHaveBeenCalledWith({ message: "Password updated successfully. You may now log in with your new credentials." });
    });

    it('BE-UT-28: Invalid token → 401', async () => {
        req.body = { id: '123', token: 'wrong', newPassword: 'new' };
        jest.spyOn(authService, 'resetPassword').mockRejectedValue(new Error('Security parameters are invalid.'));

        await authController.resetPasswordAction(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Security parameters are invalid.' });
    });

    it('BE-UT-29: Unauthorized attempt → 403', async () => {
        req.body = { id: '123', token: 'abc', newPassword: 'new' };
        jest.spyOn(authService, 'resetPassword').mockRejectedValue(new Error('Unauthorized access attempt.'));

        await authController.resetPasswordAction(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized access attempt.' });
    });

    it('BE-UT-30: Generic error → fallback 401', async () => {
        req.body = { id: '123', token: 'abc', newPassword: 'new' };
        jest.spyOn(authService, 'resetPassword').mockRejectedValue(new Error('Database boom'));

        await authController.resetPasswordAction(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Security token is invalid, expired, or has already been used." });
    });

    it('BE-UT-48: JWT reset token re-use after password changed', async () => {
        req.body = { id: '123', token: 'used_token', newPassword: 'new' };
        // A replay attack throws because jwt.verify fails after password hash changes
        jest.spyOn(authService, 'resetPassword').mockRejectedValue(new Error('JsonWebTokenError'));

        await authController.resetPasswordAction(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Security token is invalid, expired, or has already been used." });
    });
});

describe('logout', () => {
    it('BE-UT-09: Cookie cleared', () => {
        req.cookies = { token: 'mock-token' };
        authController.logout(req, res);
        expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Session successfully terminated." });
    });

    it('BE-UT-10: No token cookie', () => {
        req.cookies = {}; // No token
        authController.logout(req, res);
        expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Session successfully terminated." });
    });
});
});
