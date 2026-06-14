import { jest } from '@jest/globals';
import request from 'supertest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const express = require('../../../backend/node_modules/express');
const cookieParser = require('../../../backend/node_modules/cookie-parser');
import patientRoutes from '@backend/routes/patientRoutes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/', patientRoutes);

describe('patientRoutes Unit Tests', () => {
    it('BE-UT-120: patient routes require auth middleware', async () => {
        // verifyToken middleware checks for a token and returns 401 if missing.
        // If it is correctly applied to all routes, they should all fail with 401 here.
        
        const resSearch = await request(app).get('/api/search-patients?query=test');
        expect(resSearch.status).toBe(401);
        expect(resSearch.body).toEqual({ message: "Missing token" });
        
        const resGet = await request(app).get('/patient/some-id');
        expect(resGet.status).toBe(401);
        
        const resPost = await request(app).post('/new-entry').send({ name: 'test' });
        expect(resPost.status).toBe(401);
        
        const resPut = await request(app).put('/update/some-id').send({});
        expect(resPut.status).toBe(401);
        
        const resDelete = await request(app).delete('/patient/some-id');
        expect(resDelete.status).toBe(401);
    });
});
