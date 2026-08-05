import { validateVitals } from '@backend/validators/patientValidator.js';

describe('patientValidator Unit Tests', () => {
    describe('validateVitals', () => {
        it('BE-UT-138: Happy Path: valid vitals', () => {
            expect(() => validateVitals({ pulse: 80, spO2: 98, bp: { systolic: 120, diastolic: 80 } })).not.toThrow();
            expect(() => validateVitals({})).not.toThrow();
        });

        it('BE-UT-105: BP Missing Diastolic', () => {
            expect(() => validateVitals({ bp: { systolic: 120 } })).toThrow('Both systolic and diastolic pressures must be provided together');
            expect(() => validateVitals({ bp: { systolic: 120, diastolic: null } })).toThrow('Both systolic and diastolic pressures must be provided together');
        });

        it('BE-UT-106: BP Missing Systolic', () => {
            expect(() => validateVitals({ bp: { diastolic: 80 } })).toThrow('Both systolic and diastolic pressures must be provided together');
            expect(() => validateVitals({ bp: { systolic: null, diastolic: 80 } })).toThrow('Both systolic and diastolic pressures must be provided together');
        });

        it('BE-UT-103: Vitals bounds check', () => {
            expect(() => validateVitals({ pulse: 350 })).toThrow('Too big: expected number to be <=300');
            expect(() => validateVitals({ spO2: 150 })).toThrow('Too big: expected number to be <=100');
            expect(() => validateVitals({ bp: { systolic: 350, diastolic: 80 } })).toThrow('Too big: expected number to be <=300');
            expect(() => validateVitals({ bp: { systolic: 120, diastolic: 250 } })).toThrow('Too big: expected number to be <=200');
        });

        it('BE-UT-107: null input passes (nullable schema)', () => {
            expect(() => validateVitals(null)).not.toThrow();
        });

        it('BE-UT-108: Non-numeric type for pulse', () => {
            expect(() => validateVitals({ pulse: 'fast' })).toThrow();
        });

        it('BE-UT-109: Negative pulse (lower bound)', () => {
            expect(() => validateVitals({ pulse: -10 })).toThrow('Too small: expected number to be >=0');
        });
    });
});
