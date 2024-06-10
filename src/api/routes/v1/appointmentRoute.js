const express = require('express');
const router = express.Router();
const appointmentController = require('../../controllers/appointmentController');

router.post('/', appointmentController.createAppointment);

router.get('/user/:userId', appointmentController.getAppointmentsByUser);

router.get('/available-time-slots/:doctorId/:appointmentDate', appointmentController.getAvailableTimeSlots);
router.get('/doctor/:doctorId', appointmentController.getAppointmentsByDoctor);


module.exports = router;
