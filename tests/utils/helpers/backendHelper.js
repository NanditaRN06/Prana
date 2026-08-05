import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import nodemailer from 'nodemailer';
import app from '@backend/server.js';
import User from '@backend/models/User.js';
import Patient from '@backend/models/Patient.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jwt = require('../../../backend/node_modules/jsonwebtoken');

export const clearDatabase = async () => {
    await User.deleteMany({});
    await Patient.deleteMany({});
};

export const closeDatabase = async () => {
    await mongoose.connection.close();
};

export const getApp = () => app;

export const mockNodemailer = () => {
    const sendMailMock = jest.fn().mockResolvedValue(true);
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: sendMailMock
    });
    return sendMailMock;
};

export const createTestUser = async (userData) => {
    const randomIp = `192.168.1.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    // Signup using the API to ensure password hashing and correct defaults
    await request(app).post('/signup')
        .set('X-Forwarded-For', randomIp)
        .send(userData);
    // Login to get the auth cookie
    const loginRes = await request(app).post('/login')
        .set('X-Forwarded-For', randomIp)
        .send({
        username: userData.username,
        password: userData.password
    });
    return {
        cookie: loginRes.headers['set-cookie'],
        userId: loginRes.body.user ? loginRes.body.user.id : null,
        ip: randomIp
    };
};

export const getTestUserId = async (username) => {
    const user = await User.findOne({ username });
    return user ? user._id.toString() : null;
};

export const generateResetToken = async (email) => {
    const user = await User.findOne({ email });
    const secret = process.env.JWT_SECRET + user.password;
    const token = jwt.sign({ id: user._id.toString() }, secret, { expiresIn: '15m' });
    return { userId: user._id.toString(), token };
};
