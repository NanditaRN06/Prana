import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as patientService from '@frontend/services/patientService';
import apiClient from '@frontend/services/apiClient';

vi.mock('@frontend/services/apiClient', () => {
    return {
        default: {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
        }
    };
});

describe('patientService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('FE-UT-34: createPatient - POST patient data, returns response.data', async () => {
        const mockData = { name: 'Alice', age: 30 };
        const mockResponse = { data: { id: 1, name: 'Alice' } };
        apiClient.post.mockResolvedValueOnce(mockResponse);

        const result = await patientService.createPatient(mockData);
        expect(apiClient.post).toHaveBeenCalledWith('/new-entry', mockData);
        expect(result).toEqual(mockResponse.data);
    });

    it('FE-UT-35: createPatient - Validation fails — error propagated', async () => {
        const mockError = new Error('Bad Request');
        apiClient.post.mockRejectedValueOnce(mockError);

        await expect(patientService.createPatient({})).rejects.toThrow('Bad Request');
    });

    it('FE-UT-36: getPatient - GET patient by name, returns data', async () => {
        const mockResponse = { data: { name: 'Alice' } };
        apiClient.get.mockResolvedValueOnce(mockResponse);

        const result = await patientService.getPatient('Alice');
        expect(apiClient.get).toHaveBeenCalledWith('/patient/Alice');
        expect(result).toEqual(mockResponse.data);
    });

    it('FE-UT-37: updatePatient - PUT patient data, returns response', async () => {
        const mockData = { age: 31 };
        const mockResponse = { data: { name: 'Alice', age: 31 } };
        apiClient.put.mockResolvedValueOnce(mockResponse);

        const result = await patientService.updatePatient('Alice', mockData);
        expect(apiClient.put).toHaveBeenCalledWith('/update/Alice', mockData);
        expect(result).toEqual(mockResponse.data);
    });

    it('FE-UT-38: deletePatient - DELETE patient, returns response', async () => {
        const mockResponse = { data: { message: 'Deleted' } };
        apiClient.delete.mockResolvedValueOnce(mockResponse);

        const result = await patientService.deletePatient('Alice');
        expect(apiClient.delete).toHaveBeenCalledWith('/patient/Alice');
        expect(result).toEqual(mockResponse.data);
    });

    it('FE-UT-39: searchPatients - GET with query, returns match list', async () => {
        const mockResponse = { data: [{ name: 'Alice' }] };
        apiClient.get.mockResolvedValueOnce(mockResponse);

        const result = await patientService.searchPatients('Al');
        expect(apiClient.get).toHaveBeenCalledWith('/api/search-patients?query=Al');
        expect(result).toEqual(mockResponse.data);
    });

    it('FE-UT-40: getPatient - Patient not found — error propagated', async () => {
        const mockError = new Error('Not Found');
        apiClient.get.mockRejectedValueOnce(mockError);

        await expect(patientService.getPatient('Unknown')).rejects.toThrow('Not Found');
    });

    it('FE-UT-41: updatePatient - Update fails — error propagated', async () => {
        const mockError = new Error('Server Error');
        apiClient.put.mockRejectedValueOnce(mockError);

        await expect(patientService.updatePatient('Alice', {})).rejects.toThrow('Server Error');
    });

    it('FE-UT-42: deletePatient - Delete fails — error propagated', async () => {
        const mockError = new Error('Server Error');
        apiClient.delete.mockRejectedValueOnce(mockError);

        await expect(patientService.deletePatient('Alice')).rejects.toThrow('Server Error');
    });

    it('FE-UT-43: searchPatients - Search fails — error propagated', async () => {
        const mockError = new Error('Server Error');
        apiClient.get.mockRejectedValueOnce(mockError);

        await expect(patientService.searchPatients('Al')).rejects.toThrow('Server Error');
    });
});
