import { jest } from '@jest/globals';
import authService from '@backend/services/authService.js';
import User from '@backend/models/User.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const nodemailer = require('../../../backend/node_modules/nodemailer/lib/nodemailer');
import fs from 'fs';
const bcrypt = require('../../../backend/node_modules/bcryptjs');
const jwt = require('../../../backend/node_modules/jsonwebtoken');

describe('authService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('requestPasswordReset', () => {
        it('BE-UT-11: Template substitution', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: 'hashedpwd',
                fullName: 'John Doe'
            };

            jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

            const mockSendMail = jest.fn().mockResolvedValue(true);
            jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
                sendMail: mockSendMail
            });

            const mockTemplate = '<p>Hello {{fullName}}, link: {{resetLink}}</p>';
            jest.spyOn(fs, 'readFileSync').mockReturnValue(mockTemplate);

            await authService.requestPasswordReset('test@example.com');

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(mockSendMail).toHaveBeenCalled();

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.to).toBe('test@example.com');
            expect(mailOptions.html).toContain('John Doe');
            expect(mailOptions.html).toContain('reset-password?id=user123&token=');
        });

        it('BE-UT-37: requestPasswordReset — email not found — silent', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue(null);
            const res = await authService.requestPasswordReset('ghost@test.com');
            expect(res).toBe(true);
        });

        it('BE-UT-12: Email not found', async () => {
            // Test plan lists this as authService forgotPassword Email not found (404), 
            // but implementation is anti-enumeration. We assert the silent return.
            jest.spyOn(User, 'findOne').mockResolvedValue(null);
            const res = await authService.requestPasswordReset('notfound@test.com');
            expect(res).toBe(true);
        });

        it('BE-UT-14: requestPasswordReset — mailer throws internally', async () => {
            process.env.JWT_SECRET = 'test_secret';
            jest.spyOn(User, 'findOne').mockResolvedValue({ email: 'test@example.com', password: 'old' });
            jest.spyOn(fs, 'readFileSync').mockReturnValue('<p>Template</p>');
            
            const mockSendMail = jest.fn().mockRejectedValue(new Error('Mailer throws internally'));
            jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail: mockSendMail });

            await expect(authService.requestPasswordReset('test@example.com'))
                .rejects.toThrow('Mailer throws internally');
        });
    });

    describe('signupUser', () => {
        it('BE-UT-04: Duplicate Phone', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue({ email: 'other@test.com', username: 'other', phoneNumber: '1234567890' });
            await expect(authService.signupUser({ email: 'new@test.com', username: 'new', password: 'pwd', phoneNumber: '1234567890' }))
                .rejects.toThrow('Phone number is already registered.');
        });
        
        it('BE-UT-126: Happy Path: Signup', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue(null);
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_pwd');
            jest.spyOn(User, 'create').mockResolvedValue({ _id: '1', username: 'new' });
            
            const res = await authService.signupUser({ email: 'new@test.com', username: 'new', password: 'pwd', phoneNumber: '1234567890' });
            expect(res).toEqual({ _id: '1', username: 'new' });
        });

        it('BE-UT-31: Email already registered', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue({ email: 'taken@test.com', username: 'other' });
            await expect(authService.signupUser({ email: 'taken@test.com', username: 'new', password: 'pwd' }))
                .rejects.toThrow('Email address is already registered.');
        });

        it('BE-UT-32: Username already taken', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue({ email: 'other@test.com', username: 'taken' });
            await expect(authService.signupUser({ email: 'new@test.com', username: 'taken', password: 'pwd' }))
                .rejects.toThrow('Username is already taken.');
        });

        it('BE-UT-33: Empty phoneNumber treated as undefined', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue(null);
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_pwd');
            const createSpy = jest.spyOn(User, 'create').mockResolvedValue({ _id: '1', username: 'new' });
            
            await authService.signupUser({ email: 'new@test.com', username: 'new', password: 'pwd', phoneNumber: '' });
            
            // Check that create was called with undefined for phoneNumber
            expect(createSpy.mock.calls[0][0].phoneNumber).toBeUndefined();
        });
    });

    describe('loginUser', () => {
        it('BE-UT-06: Incorrect Password', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue({ username: 'user', password: 'hashed_pwd', status: 'active' });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
            
            await expect(authService.loginUser({ username: 'user', password: 'wrong_pwd' }))
                .rejects.toThrow('Incorrect password. Please try again.');
        });

        it('BE-UT-127: Happy Path: Login', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue({ _id: '1', username: 'user', email: 'u@test.com', role: 'user', password: 'hashed_pwd', status: 'active' });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            jest.spyOn(jwt, 'sign').mockReturnValue('mock_token');
            
            const res = await authService.loginUser({ username: 'user', password: 'pwd' });
            expect(res).toBe('mock_token');
        });

        it('BE-UT-34: loginUser — user not found', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue(null);
            await expect(authService.loginUser({ username: 'ghost', password: 'pwd' }))
                .rejects.toThrow('Invalid credentials. Please verify your username/email.');
        });

        it('BE-UT-35: loginUser — deactivated user', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue({ status: 'deactivated' });
            await expect(authService.loginUser({ username: 'user', password: 'pwd' }))
                .rejects.toThrow('This account has been deactivated. Please contact support for assistance.');
        });

        it('BE-UT-36: JWT payload contains correct fields', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue({ _id: '1', username: 'user', email: 'u@test.com', role: 'admin', password: 'hashed_pwd', status: 'active' });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            const signSpy = jest.spyOn(jwt, 'sign').mockReturnValue('mock_token');
            
            await authService.loginUser({ username: 'user', password: 'pwd' });
            
            expect(signSpy.mock.calls[0][0]).toEqual({
                id: '1', username: 'user', email: 'u@test.com', role: 'admin'
            });
        });
    });

    describe('verifyPasswordReset', () => {
        it('BE-UT-128: Happy Path: verify', async () => {
            jest.spyOn(User, 'findById').mockResolvedValue({ _id: '1', password: 'pwd' });
            jest.spyOn(jwt, 'verify').mockReturnValue({ id: '1' });
            
            const res = await authService.verifyPasswordReset('1', 'token');
            expect(res).toBe(true);
        });

        it('BE-UT-38: verifyPasswordReset — user not found', async () => {
            jest.spyOn(User, 'findById').mockResolvedValue(null);
            await expect(authService.verifyPasswordReset('invalid', 'token'))
                .rejects.toThrow('Security parameters are invalid.');
        });

        it('BE-UT-39: verifyPasswordReset — JWT verify throws', async () => {
            jest.spyOn(User, 'findById').mockResolvedValue({ _id: '1', password: 'pwd' });
            jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('jwt expired'); });
            
            await expect(authService.verifyPasswordReset('1', 'token'))
                .rejects.toThrow('jwt expired');
        });

        it('BE-UT-40: verifyPasswordReset — ID mismatch', async () => {
            jest.spyOn(User, 'findById').mockResolvedValue({ _id: '1', password: 'pwd' });
            jest.spyOn(jwt, 'verify').mockReturnValue({ id: '2' });
            
            await expect(authService.verifyPasswordReset('1', 'token'))
                .rejects.toThrow('Unauthorized.');
        });
    });

    describe('resetPassword', () => {
        it('BE-UT-129: Happy Path: reset', async () => {
            const mockUser = { _id: '1', password: 'old', save: jest.fn().mockResolvedValue(true) };
            jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
            jest.spyOn(jwt, 'verify').mockReturnValue({ id: '1' });
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hashed');
            
            const res = await authService.resetPassword('1', 'token', 'new_pwd');
            expect(res).toBe(true);
            expect(mockUser.password).toBe('new_hashed');
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('BE-UT-41: resetPassword — user not found', async () => {
            jest.spyOn(User, 'findById').mockResolvedValue(null);
            await expect(authService.resetPassword('invalid', 'token', 'new'))
                .rejects.toThrow('Security parameters are invalid.');
        });

        it('BE-UT-42: resetPassword — ID mismatch', async () => {
            jest.spyOn(User, 'findById').mockResolvedValue({ _id: '1', password: 'pwd' });
            jest.spyOn(jwt, 'verify').mockReturnValue({ id: '2' });
            
            await expect(authService.resetPassword('1', 'token', 'new'))
                .rejects.toThrow('Unauthorized access attempt.');
        });
    });
});
