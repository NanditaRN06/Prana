// backend/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const patientRoutes = require('./patientRoutes');
const userRoutes = require('./userRoutes');

router.use('/', authRoutes);
router.use('/', patientRoutes);
router.use('/api', userRoutes);

module.exports = router;
