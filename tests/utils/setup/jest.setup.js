import dotenv from 'dotenv';
import path from 'path';
import { jest } from '@jest/globals';

// Load environment variables for each test worker process
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Silence console.error during tests to prevent log pollution
console.error = jest.fn();
