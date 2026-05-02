// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyUser = require('../middlewares/verifyUser');
const jwt = require('jsonwebtoken');

router.get('/check-auth', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    jwt.verify(token, process.env.JWT_SECRET || "jwt_secret_key", (err) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        res.status(200).json({ message: 'Authenticated' });
    });
});

router.get('/account', verifyUser, userController.getAccount);
router.put('/account', verifyUser, userController.updateAccount);
router.delete('/account', verifyUser, userController.deleteAccount);
router.post('/deactivate', verifyUser, userController.deactivateAccount);

module.exports = router;
