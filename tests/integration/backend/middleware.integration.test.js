import request from 'supertest';
import { getApp } from '../../utils/helpers/backendHelper.js';

const app = getApp();

describe('Root Endpoint & Middleware (BE-IT-81 to BE-IT-83)', () => {

    it('BE-IT-81: Root Endpoint → Health Check', async () => {
        const res = await request(app).get('/');

        expect(res.status).toBe(200);
        expect(res.text).toBe("Prana Backend Server is Live and Running!");
    });

    it('BE-IT-82: Helmet Headers', async () => {
        const res = await request(app).get('/');

        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('BE-IT-83: CORS Headers', async () => {
        const res = await request(app)
            .get('/')
            .set('Origin', 'http://localhost:5173');

        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
        expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
});
