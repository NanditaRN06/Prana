import { jest } from '@jest/globals';
import request from 'supertest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const express = require('../../../backend/node_modules/express');
const cookieParser = require('../../../backend/node_modules/cookie-parser');
import userRoutes from '@backend/routes/userRoutes.js';
const jwt = require('../../../backend/node_modules/jsonwebtoken');

describe('userRoutes Unit Tests', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(cookieParser());
        app.use('/user', userRoutes);
        process.env.JWT_SECRET = 'test_secret';
    });

    describe('GET /check-auth', () => {
        it('BE-UT-63: Valid token → 200', async () => {
            const token = jwt.sign({ id: '1' }, process.env.JWT_SECRET);
            const res = await request(app)
                .get('/user/check-auth')
                .set('Cookie', [`token=${token}`]);
            
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'Authenticated' });
        });

        it('BE-UT-64: Missing token → 401', async () => {
            const res = await request(app).get('/user/check-auth');
            
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'Not authenticated' });
        });

        it('BE-UT-65: Invalid/expired token → 401', async () => {
            const res = await request(app)
                .get('/user/check-auth')
                .set('Cookie', ['token=invalid_token']);
            
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'Invalid token' });
        });
    });
});
