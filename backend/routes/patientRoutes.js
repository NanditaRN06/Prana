// backend/routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const verifyUser = require('../middlewares/verifyUser');

router.post('/new-entry', verifyUser, patientController.newEntry);
router.get('/patient/:patientId', verifyUser, patientController.getPatient);
router.put('/update/:patientId', verifyUser, patientController.updatePatient);
router.delete('/patient/:patientId', verifyUser, patientController.deletePatient);
router.get('/api/search-patients', verifyUser, patientController.searchPatients);

module.exports = router;
