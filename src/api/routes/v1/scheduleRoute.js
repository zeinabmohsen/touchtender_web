const express = require('express');
const router = express.Router();
const scheduleController = require('../../controllers/scheduleController');

router.post('', scheduleController.createSchedule);

router.put('/:scheduleId', scheduleController.updateSchedule);

router.get('/:doctorId', scheduleController.getScheduleByDoctorId);

module.exports = router;
