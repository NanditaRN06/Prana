import { jest } from '@jest/globals';
import patientService from '@backend/services/patientService.js';
import Patient from '@backend/models/Patient.js';
import * as patientValidator from '@backend/validators/patientValidator.js';

describe('patientService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createPatientEntry', () => {
        it('BE-UT-132: Happy Path: create without vitals', async () => {
            const mockSave = jest.fn().mockResolvedValue(true);
            jest.spyOn(Patient.prototype, 'save').mockImplementation(mockSave);
            
            const res = await patientService.createPatientEntry({ name: 'Bob', userId: '1' });
            expect(res.name).toBe('Bob');
            expect(mockSave).toHaveBeenCalled();
        });

        it('BE-UT-133: Happy Path: create with vitals', async () => {
            const mockSave = jest.fn().mockResolvedValue(true);
            jest.spyOn(Patient.prototype, 'save').mockImplementation(mockSave);
            
            await patientService.createPatientEntry({ name: 'Bob', userId: '1', vitals: { pulse: 80, spO2: 98, bp: { systolic: 120, diastolic: 80 } } });
            expect(mockSave).toHaveBeenCalled();
        });

        it('BE-UT-92: Vitals validation throws → propagates', async () => {
            await expect(patientService.createPatientEntry({ name: 'Bob', userId: '1', vitals: { pulse: 999 } }))
                .rejects.toThrow('Too big: expected number to be <=300');
        });
    });

    describe('getPatientByIdAndUserId', () => {
        it('BE-UT-78: Basic patient lookup', async () => {
            jest.spyOn(Patient, 'findOne').mockResolvedValue({ name: 'john doe' });
            const res = await patientService.getPatientByIdAndUserId('john doe', '1');
            expect(res.name).toBe('john doe');
        });

        it('BE-UT-134: Failure: not found', async () => {
            jest.spyOn(Patient, 'findOne').mockResolvedValue(null);
            await expect(patientService.getPatientByIdAndUserId('john doe', '1')).rejects.toThrow('Clinical record not found for the specified patient.');
        });

        it('BE-UT-96: Name with regex special chars escaped', async () => {
            jest.spyOn(Patient, 'findOne').mockResolvedValue({ name: 'Alice (2)' });
            const res = await patientService.getPatientByIdAndUserId('Alice (2)', '1');
            expect(res.name).toBe('Alice (2)');
            expect(Patient.findOne).toHaveBeenCalledWith({
                userId: '1',
                name: { $regex: new RegExp(`^Alice \\(2\\)$`, 'i') }
            });
        });
    });

    describe('updatePatientEntry', () => {
        it('BE-UT-79: Version History Pushed', async () => {
            const mockPatient = {
                name: 'john', userId: '1', clinicalDiagnosis: 'old',
                toObject: () => ({ name: 'john', clinicalDiagnosis: 'old' })
            };
            jest.spyOn(Patient, 'findOne').mockResolvedValue(mockPatient);
            jest.spyOn(Patient, 'findOneAndUpdate').mockResolvedValue(true);

            await patientService.updatePatientEntry('john', '1', { clinicalDiagnosis: 'new' });
            
            expect(Patient.findOneAndUpdate).toHaveBeenCalledWith(
                { name: 'john', userId: '1' },
                expect.objectContaining({
                    $set: { clinicalDiagnosis: 'new' },
                    $push: expect.objectContaining({
                        versions: expect.objectContaining({ changeSummary: 'Edited Clinical Diagnosis' })
                    })
                }),
                expect.any(Object)
            );
        });

        it('BE-UT-80: Manual Update Summary', async () => {
            const mockPatient = {
                name: 'john', userId: '1', clinicalDiagnosis: 'old',
                toObject: () => ({ name: 'john', clinicalDiagnosis: 'old' })
            };
            jest.spyOn(Patient, 'findOne').mockResolvedValue(mockPatient);
            jest.spyOn(Patient, 'findOneAndUpdate').mockResolvedValue(true);

            await patientService.updatePatientEntry('john', '1', { clinicalDiagnosis: 'old' });
            
            expect(Patient.findOneAndUpdate).toHaveBeenCalledWith(
                { name: 'john', userId: '1' },
                expect.objectContaining({
                    $push: expect.objectContaining({
                        versions: expect.objectContaining({ changeSummary: 'Manual Update' })
                    })
                }),
                expect.any(Object)
            );
        });

        it('BE-UT-135: Happy Path: Update with vitals', async () => {
            const mockPatient = {
                name: 'john', userId: '1', vitals: { pulse: 80 },
                toObject: () => ({ name: 'john', vitals: { pulse: 80 } })
            };
            jest.spyOn(Patient, 'findOne').mockResolvedValue(mockPatient);
            jest.spyOn(Patient, 'findOneAndUpdate').mockResolvedValue(true);

            await patientService.updatePatientEntry('john', '1', { vitals: { pulse: 90, spO2: 98, bp: { systolic: 120, diastolic: 80 } } });
            expect(Patient.findOneAndUpdate).toHaveBeenCalled();
        });

        it('BE-UT-136: Failure: not found', async () => {
            jest.spyOn(Patient, 'findOne').mockResolvedValue(null);
            await expect(patientService.updatePatientEntry('john', '1', {})).rejects.toThrow('Patient record not found.');
        });

        it('BE-UT-93: Disallowed fields excluded from $set', async () => {
            const mockPatient = { name: 'john', userId: '1', toObject: () => ({ name: 'john' }) };
            jest.spyOn(Patient, 'findOne').mockResolvedValue(mockPatient);
            jest.spyOn(Patient, 'findOneAndUpdate').mockResolvedValue(true);

            await patientService.updatePatientEntry('john', '1', { _id: "fake", userId: "hijack", name: 'new name' });
            
            expect(Patient.findOneAndUpdate).toHaveBeenCalledWith(
                { name: 'john', userId: '1' },
                expect.not.objectContaining({ $set: expect.objectContaining({ _id: 'fake', userId: 'hijack' }) }),
                { new: true, runValidators: true }
            );
        });

        it('BE-UT-87: Disallowed fields stripped from body', async () => {
            const mockPatient = { name: 'john', userId: '1', toObject: () => ({ name: 'john' }) };
            jest.spyOn(Patient, 'findOne').mockResolvedValue(mockPatient);
            jest.spyOn(Patient, 'findOneAndUpdate').mockResolvedValue(true);

            await patientService.updatePatientEntry('john', '1', { _id: "fake", userId: "hijack", age: 30 });
            
            expect(Patient.findOneAndUpdate).toHaveBeenCalledWith(
                { name: 'john', userId: '1' },
                expect.not.objectContaining({ $set: expect.objectContaining({ _id: 'fake', userId: 'hijack' }) }),
                { new: true, runValidators: true }
            );
        });

        it('BE-UT-100: Invalid vitals during update → throws', async () => {
            const mockPatient = {
                name: 'john', userId: '1',
                toObject: () => ({ name: 'john' })
            };
            jest.spyOn(Patient, 'findOne').mockResolvedValue(mockPatient);
            // This should throw from validateVitals before updating DB
            await expect(patientService.updatePatientEntry('john', '1', { vitals: { pulse: 999 } }))
                .rejects.toThrow('Too big: expected number to be <=300');
        });
    });

    describe('deletePatientEntry', () => {
        it('BE-UT-81: Clean Purge', async () => {
            jest.spyOn(Patient, 'findOneAndDelete').mockResolvedValue(true);
            const res = await patientService.deletePatientEntry('john', '1');
            expect(res).toBe(true);
        });

        it('BE-UT-137: Failure: not found', async () => {
            jest.spyOn(Patient, 'findOneAndDelete').mockResolvedValue(null);
            await expect(patientService.deletePatientEntry('john', '1')).rejects.toThrow('Record not found for deletion.');
        });
    });

    describe('searchPatientRecords', () => {
        it('BE-UT-83: Multi-field Search', async () => {
            jest.spyOn(Patient, 'find').mockResolvedValue([{ name: 'flu' }]);
            const res = await patientService.searchPatientRecords('flu', '1');
            expect(res).toEqual([{ name: 'flu' }]);
        });

        it('BE-UT-94: Special-char query escaped correctly', async () => {
            jest.spyOn(Patient, 'find').mockResolvedValue([]);
            await patientService.searchPatientRecords('.*', '1');
            
            const findArg = Patient.find.mock.calls[0][0];
            expect(findArg.$or[0].name.$regex).toBe('\\.\\*');
        });

        it('BE-UT-95: Returns [] when no match (not error)', async () => {
            jest.spyOn(Patient, 'find').mockResolvedValue([]);
            const res = await patientService.searchPatientRecords('nonexistent', '1');
            expect(res).toEqual([]);
        });
    });
});
