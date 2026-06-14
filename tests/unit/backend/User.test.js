import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '@backend/models/User.js';

describe('User Model Unit Tests', () => {
    let mongoServer;
    jest.setTimeout(60000);

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        await User.init();
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    it('BE-UT-123: Required fields missing', async () => {
        const userData = { fullName: 'Only Name' };
        const user = new User(userData);
        await expect(user.save()).rejects.toThrow(/members validation failed/);
    });

    it('BE-UT-124: Invalid status enum value', async () => {
        const userData = {
            fullName: 'Test User',
            email: 'test@example.com',
            username: 'testuser',
            password: 'pwd',
            status: 'suspended'
        };
        const user = new User(userData);
        await expect(user.save()).rejects.toThrow(/members validation failed.*status/);
    });

    it('BE-UT-125: Duplicate email rejected by unique index', async () => {
        const userData1 = {
            fullName: 'User One',
            email: 'duplicate@example.com',
            username: 'userone',
            password: 'pwd'
        };
        const user1 = new User(userData1);
        await user1.save();

        const userData2 = {
            fullName: 'User Two',
            email: 'duplicate@example.com', // Duplicate
            username: 'usertwo',
            password: 'pwd'
        };
        const user2 = new User(userData2);
        
        // MongoError for unique index (code 11000)
        let error;
        try {
            await user2.save();
        } catch (err) {
            error = err;
        }
        
        expect(error).toBeDefined();
        expect(error.code).toBe(11000); // Duplicate key error
    });

    it('BE-UT-116: Duplicate phoneNumber rejected by sparse unique index', async () => {
        const userData1 = {
            fullName: 'User One',
            email: 'one@example.com',
            username: 'userone',
            password: 'pwd',
            phoneNumber: '9876543210'
        };
        const user1 = new User(userData1);
        await user1.save();

        const userData2 = {
            fullName: 'User Two',
            email: 'two@example.com',
            username: 'usertwo',
            password: 'pwd',
            phoneNumber: '9876543210'
        };
        const user2 = new User(userData2);
        
        let error;
        try {
            await user2.save();
        } catch (err) {
            error = err;
        }
        
        expect(error).toBeDefined();
        expect(error.code).toBe(11000); // Duplicate key error
    });
});
