import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';

import mongoose from 'mongoose';
import Patient from '@backend/models/Patient.js';

describe('Patient Model Unit Tests', () => {
    let mongoServer;
    jest.setTimeout(60000); // 60 seconds for MongoMemoryServer and coverage overhead

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

    afterEach(async () => {
        await Patient.deleteMany({});
    });

    it('BE-UT-101: Version array tracking', async () => {
        const patientData = {
            userId: new mongoose.Types.ObjectId(),
            name: 'John Doe',
            age: 30,
            examdate: new Date(),
            allergies: 'None'
        };

        const patient = new Patient(patientData);
        await patient.save();

        const savedPatient = await Patient.findById(patient._id);
        expect(savedPatient.versions).toBeDefined();
        expect(Array.isArray(savedPatient.versions)).toBe(true);
        expect(savedPatient.versions.length).toBe(0);
    });

    it('BE-UT-102: Invalid Investigation type', async () => {
        const patientData = {
            userId: new mongoose.Types.ObjectId(),
            name: 'Jane Doe',
            age: 25,
            examdate: new Date(),
            allergies: 'None',
            investigationDetails: {
                // Testing schema casting/validation error
                // We'll pass a string instead of array for CT
                ct: "This should be an array of objects"
            }
        };

        const patient = new Patient(patientData);
        let error = null;
        try {
            await patient.save();
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.name).toBe('ValidationError');
    });

    it('BE-UT-70: Nested Investigations', async () => {
        const patientData = {
            userId: new mongoose.Types.ObjectId(),
            name: 'Alice',
            age: 40,
            examdate: new Date(),
            allergies: 'None',
            investigationDetails: {
                ct: [{ region: 'Head', contrast: 'Yes' }]
            }
        };

        const patient = new Patient(patientData);
        await patient.save();

        const savedPatient = await Patient.findById(patient._id);
        expect(savedPatient.investigationDetails.ct).toHaveLength(1);
        expect(savedPatient.investigationDetails.ct[0].region).toBe('Head');
        expect(savedPatient.investigationDetails.ct[0].contrast).toBe('Yes');
    });

    it('BE-UT-110: Required fields missing', async () => {
        const patientData = { name: 'Only Name' };
        const patient = new Patient(patientData);
        await expect(patient.save()).rejects.toThrow(/Patient validation failed/);
    });

    it('BE-UT-111: Phone — 9-digit number rejected', async () => {
        const patientData = {
            userId: new mongoose.Types.ObjectId(),
            name: 'John', age: 30, examdate: new Date(), allergies: 'None',
            phone: '123456789'
        };
        const patient = new Patient(patientData);
        await expect(patient.save()).rejects.toThrow(/validation failed/);
    });

    it('BE-UT-112: Phone — non-numeric string rejected', async () => {
        const patientData = {
            userId: new mongoose.Types.ObjectId(),
            name: 'John', age: 30, examdate: new Date(), allergies: 'None',
            phone: 'abcdefghij'
        };
        const patient = new Patient(patientData);
        await expect(patient.save()).rejects.toThrow(/validation failed/);
    });

    it('BE-UT-113: Empty string phone allowed', async () => {
        const patientData = {
            userId: new mongoose.Types.ObjectId(),
            name: 'John', age: 30, examdate: new Date(), allergies: 'None',
            phone: ''
        };
        const patient = new Patient(patientData);
        await patient.save();
        const savedPatient = await Patient.findById(patient._id);
        expect(savedPatient.phone).toBe('');
    });

    it('BE-UT-104: Phone validation (10d)', async () => {
        const patientData = {
            userId: new mongoose.Types.ObjectId(),
            name: 'John', age: 30, examdate: new Date(), allergies: 'None',
            phone: '9876543210'
        };
        const patient = new Patient(patientData);
        await expect(patient.save()).resolves.not.toThrow();
    });

    it('BE-UT-114: Invalid age type — string rejected', async () => {
        const patientData = {
            userId: new mongoose.Types.ObjectId(),
            name: 'John', age: 'five', examdate: new Date(), allergies: 'None'
        };
        const patient = new Patient(patientData);
        await expect(patient.save()).rejects.toThrow(/validation failed/);
    });

    it('BE-UT-115: Invalid age — negative value rejected', async () => {
        const patientData = {
            userId: new mongoose.Types.ObjectId(),
            name: 'John', age: -1, examdate: new Date(), allergies: 'None'
        };
        const patient = new Patient(patientData);
        await expect(patient.save()).rejects.toThrow(/validation failed/);
    });
});
