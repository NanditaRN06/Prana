import { jest } from '@jest/globals';
import request from 'supertest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const express = require('../../../backend/node_modules/express');

import authRoutes from '@backend/routes/authRoutes.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

describe('authRoutes Unit Tests', () => {
    let app;
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/auth', authRoutes);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('BE-UT-47: Rate limiting', async () => {
        // authLimiter max is 10. Make 11 requests concurrently to save time.
        const reqs = [];
        for (let i = 0; i < 11; i++) {
            reqs.push(request(app).post('/auth/login').send({ username: 'test', password: 'pwd' }));
        }
        
        const responses = await Promise.all(reqs);
        
        // The 11th request (or at least one of them) should be 429
        const tooMany = responses.find(r => r.status === 429);
        expect(tooMany).toBeDefined();
        expect(tooMany.body).toEqual({ message: "Too many attempts. Try again later." });
    }, 10000);

    it('BE-UT-121: forgotPassword has separate rate limiter', async () => {
        // forgotLimiter max is 5 per hour. Make 6 requests concurrently.
        const reqs = [];
        for (let i = 0; i < 6; i++) {
            reqs.push(request(app).post('/auth/forgot-password').send({ contact: 'test@example.com' }));
        }
        
        const responses = await Promise.all(reqs);
        
        // The 6th request (or at least one of them) should be 429
        const tooMany = responses.find(r => r.status === 429);
        expect(tooMany).toBeDefined();
        expect(tooMany.body).toEqual({ message: "Too many attempts. Try again later." });
    }, 10000);
});
