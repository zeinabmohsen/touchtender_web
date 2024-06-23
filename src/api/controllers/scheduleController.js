const connection = require("../../config/database");

exports.createSchedule = async (req, res) => {
    try {
        const { doctorId, dayOfWeek, startTime, endTime, slotDuration } = req.body;

        connection.query('SELECT * FROM schedules WHERE doctor_id = ? AND day_of_week = ?', [doctorId, dayOfWeek], (error, results) => {
            if (error) {
                console.error('Error checking existing schedule: ' + error);
                return res.status(500).json({ error: 'An error occurred while checking existing schedule.' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'Schedule already exists for the given doctor and day.' });
            }
            connection.query('INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time, slot_duration) VALUES (?, ?, ?, ?, ?)',
                [doctorId, dayOfWeek, startTime, endTime, slotDuration],
                (error, results) => {
                    if (error) {
                        console.error('Error creating schedule: ' + error);
                        return res.status(500).json({ error: 'An error occurred while creating the schedule.' });
                    }
                    console.log('Schedule created successfully.');
                    return res.status(201).json({ message: 'Schedule created successfully.', scheduleId: results.insertId });
                });
        });
    } catch (error) {
        console.error('Error creating schedule: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};


exports.updateSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { dayOfWeek, startTime, endTime, slotDuration } = req.body;

        connection.query('UPDATE schedules SET day_of_week = ?, start_time = ?, end_time = ?, slot_duration = ? WHERE schedule_id = ?',
            [dayOfWeek, startTime, endTime, slotDuration, scheduleId],
            (error, results) => {
                if (error) {
                    console.error('Error updating schedule: ' + error);
                    return res.status(500).json({ error: 'An error occurred while updating the schedule.' });
                }
                console.log('Schedule updated successfully.');
                return res.status(200).json({ message: 'Schedule updated successfully.' });
            });
    } catch (error) {
        console.error('Error updating schedule: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

exports.getScheduleByDoctorId = async (req, res) => {
    try {
        const { doctorId } = req.params;

        connection.query('SELECT * FROM schedules WHERE doctor_id = ?', [doctorId], (error, results) => {
            if (error) {
                console.error('Error getting schedule by doctor ID: ' + error);
                return res.status(500).json({ error: 'An error occurred while fetching the schedule.' });
            }
            console.log('Schedule fetched successfully.');
            return res.status(200).json({ schedule: results });
        });
    } catch (error) {
        console.error('Error getting schedule by doctor ID: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        connection.query('DELETE FROM schedules WHERE schedule_id = ?', [scheduleId], (error, results) => {
            if (error) {
                console.error('Error deleting schedule: ' + error);
                return res.status(500).json({ error: 'An error occurred while deleting the schedule.' });
            }
            console.log('Schedule deleted successfully.');
            return res.status(200).json({ message: 'Schedule deleted successfully.' });
        });
    } catch (error) {
        console.error('Error deleting schedule: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};
