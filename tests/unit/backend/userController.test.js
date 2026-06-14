import { jest } from '@jest/globals';
import userController from '@backend/controllers/userController.js';
import User from '@backend/models/User.js';

describe('userController Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = { user: { id: 'userId123' }, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            clearCookie: jest.fn()
        };
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('getAccount', () => {
        it('BE-UT-50: Profile retrieval', async () => {
            const mockUser = { _id: 'userId123', fullName: 'Alice' };
            jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

            await userController.getAccount(req, res);

            expect(User.findById).toHaveBeenCalledWith('userId123', '-password');
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it('BE-UT-51: Unauthenticated access', async () => {
            req.user = undefined;

            await userController.getAccount(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "User is not authenticated" });
        });

        it('BE-UT-52: User not found in DB', async () => {
            jest.spyOn(User, 'findById').mockResolvedValue(null);

            await userController.getAccount(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it('BE-UT-69: Generic DB error → 500', async () => {
            jest.spyOn(User, 'findById').mockRejectedValue(new Error('DB error'));

            await userController.getAccount(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateAccount', () => {
        it('BE-UT-53: Update Profile fields', async () => {
            const mockUser = { _id: 'userId123', fullName: 'Alice', save: jest.fn() };
            req.body = { fullName: 'New Name' };
            jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

            await userController.updateAccount(req, res);

            expect(mockUser.fullName).toBe('New Name');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: "Profile updated successfully", user: mockUser });
        });

        it('BE-UT-54: KMC Number Duplicate', async () => {
            const mockUser = { _id: 'userId123', fullName: 'Alice' };
            req.body = { kmcNumber: 'KMC123' };
            jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
            jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'otherId' }); // duplicate found

            await userController.updateAccount(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "This KMC Number is already registered." });
        });

        it('BE-UT-59: Clear phone (empty string)', async () => {
            const mockUser = { _id: 'userId123', phoneNumber: '123', save: jest.fn() };
            req.body = { phoneNumber: '' };
            jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

            await userController.updateAccount(req, res);

            expect(mockUser.phoneNumber).toBeUndefined();
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: "Profile updated successfully", user: mockUser });
        });

        it('BE-UT-60: Clear KMC (empty string)', async () => {
            const mockUser = { _id: 'userId123', kmcNumber: 'KMC123', save: jest.fn() };
            req.body = { kmcNumber: '' };
            jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

            await userController.updateAccount(req, res);

            expect(mockUser.kmcNumber).toBeUndefined();
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('BE-UT-61: Update own KMC (no false duplicate)', async () => {
            const mockUser = { _id: 'userId123', kmcNumber: 'KMC123', save: jest.fn() };
            req.body = { kmcNumber: 'KMC123' };
            jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
            jest.spyOn(User, 'findOne').mockResolvedValue(null);

            await userController.updateAccount(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ kmcNumber: 'KMC123', _id: { $ne: 'userId123' } });
            expect(mockUser.kmcNumber).toBe('KMC123');
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('BE-UT-66: User not found in DB', async () => {
            jest.spyOn(User, 'findById').mockResolvedValue(null);
            await userController.updateAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('BE-UT-67: Generic DB error → 500', async () => {
            jest.spyOn(User, 'findById').mockRejectedValue(new Error('Error'));
            await userController.updateAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('deleteAccount', () => {
        it('BE-UT-55: User self-deletion', async () => {
            jest.spyOn(User, 'findByIdAndDelete').mockResolvedValue({ _id: 'userId123' });

            await userController.deleteAccount(req, res);

            expect(User.findByIdAndDelete).toHaveBeenCalledWith('userId123');
            expect(res.json).toHaveBeenCalledWith({ message: "Account deleted successfully" });
        });

        it('BE-UT-62: Session cookie cleared after deletion', async () => {
            jest.spyOn(User, 'findByIdAndDelete').mockResolvedValue({ _id: 'userId123' });
            await userController.deleteAccount(req, res);
            expect(res.clearCookie).toHaveBeenCalledWith('token');
        });

        it('BE-UT-139: User not found in DB', async () => {
            jest.spyOn(User, 'findByIdAndDelete').mockResolvedValue(null);
            await userController.deleteAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('BE-UT-56: DB error during account deletion', async () => {
            jest.spyOn(User, 'findByIdAndDelete').mockRejectedValue(new Error('Error'));
            await userController.deleteAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('deactivateAccount', () => {
        it('BE-UT-57: Account Deactivation', async () => {
            const mockUser = { _id: 'userId123', status: 'active', save: jest.fn() };
            jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

            await userController.deactivateAccount(req, res);

            expect(mockUser.status).toBe('deactivated');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.clearCookie).toHaveBeenCalledWith('token');
            expect(res.json).toHaveBeenCalledWith({ message: "Account deactivated successfully." });
        });

        it('BE-UT-68: User not found in DB', async () => {
            jest.spyOn(User, 'findById').mockResolvedValue(null);
            await userController.deactivateAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('BE-UT-58: DB error during deactivation', async () => {
            jest.spyOn(User, 'findById').mockRejectedValue(new Error('Error'));
            await userController.deactivateAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
