import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('App Base Unit Tests', () => {
    let mongoServer;

    beforeAll(async () => {
        // Dotenv loads tests/.env.test which sets PORT=5001 and NODE_ENV=test
        process.env.NODE_ENV = 'test';
        process.env.PORT = '5001';
        
        const mongoose = (await import('mongoose')).default;
        jest.spyOn(mongoose, 'connect').mockResolvedValue(true);
        // Start the server (it will bind to 5001)
        await import('../../../backend/index.js');
    });

    afterAll(async () => {
        jest.restoreAllMocks();
    });

    it('BE-UT-118: Root endpoint alive', async () => {
        const res = await request('http://localhost:5001').get('/');
        expect(res.status).toBe(200);
        expect(res.text).toBe('Prana Backend Server is Live and Running!');
    });

    it('BE-UT-122: General rate limiter enforced', async () => {
        const res = await request('http://localhost:5001').get('/');
        // Rate limiter headers should be set
        expect(res.headers['x-ratelimit-limit']).toBeDefined();
    });
});
