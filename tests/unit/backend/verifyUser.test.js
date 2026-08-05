import { jest } from '@jest/globals';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jwt = require('../../../backend/node_modules/jsonwebtoken');
import verifyUser from '@backend/middlewares/verifyUser.js';

describe('verifyUser Middleware Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = { cookies: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();

        jest.spyOn(jwt, 'verify');
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('BE-UT-19: Valid Token access', () => {
        req.cookies.token = 'valid.jwt.token';
        const decodedToken = { id: 'user123', role: 'admin' };

        jwt.verify.mockImplementation((token, secret, callback) => {
            callback(null, decodedToken);
        });

        verifyUser(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('valid.jwt.token', process.env.JWT_SECRET, expect.any(Function));
        expect(req.user).toEqual(decodedToken);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('BE-UT-20: Malformed JWT token', () => {
        req.cookies.token = 'invalid.token';

        jwt.verify.mockImplementation((token, secret, callback) => {
            callback(new Error('jwt malformed'), null);
        });

        verifyUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
        expect(next).not.toHaveBeenCalled();
    });

    it('BE-UT-21: Missing token', () => {
        // req.cookies.token is undefined
        verifyUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Missing token" });
        expect(next).not.toHaveBeenCalled();
    });

    it('BE-UT-43: Expired JWT → 401', () => {
        req.cookies.token = 'expired.jwt.token';
        jwt.verify.mockImplementation((token, secret, callback) => {
            const err = new Error('jwt expired');
            err.name = 'TokenExpiredError';
            callback(err, null);
        });
        verifyUser(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    });

    it('BE-UT-44: Token signed with wrong secret', () => {
        req.cookies.token = 'wrong.secret.token';
        jwt.verify.mockImplementation((token, secret, callback) => {
            const err = new Error('invalid signature');
            err.name = 'JsonWebTokenError';
            callback(err, null);
        });
        verifyUser(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    });

    it('BE-UT-45: req.user populated with id and role', () => {
        req.cookies.token = 'valid.jwt.token';
        const decodedToken = { id: 'user123', role: 'admin' };
        jwt.verify.mockImplementation((token, secret, callback) => {
            callback(null, decodedToken);
        });
        verifyUser(req, res, next);
        expect(req.user.id).toBe('user123');
        expect(req.user.role).toBe('admin');
    });
});
