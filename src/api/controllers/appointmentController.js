const connection = require("../../config/database");

exports.createAppointment = async (req, res) => {
    try {
        const { userId, doctorId, appointmentDate, startTime, endTime, reason } = req.body;

        // Check if the user already has an appointment with the specified doctor on the same day
        connection.query('SELECT * FROM appointments WHERE user_id = ? AND doctor_id = ? AND DATE(appointment_date) = DATE(?) AND status != "Cancelled"', 
            [userId, doctorId, appointmentDate], (error, results) => {
                if (error) {
                    console.error('Error checking user appointments: ' + error);
                    return res.status(500).json({ error: 'An error occurred while checking user appointments.' });
                }

                if (results.length > 0) {
                    return res.status(400).json({ error: 'You already have an appointment with this doctor on the same day.' });
                }

                // Validate the appointment against the doctor's schedule
                connection.query('SELECT * FROM schedules WHERE doctor_id = ? AND day_of_week = DAYOFWEEK(?) AND start_time <= ? AND end_time >= ?', 
                    [doctorId, appointmentDate, startTime, endTime], (error, results) => {
                        if (error) {
                            console.error('Error validating appointment: ' + error);
                            return res.status(500).json({ error: 'An error occurred while validating the appointment.' });
                        }

                        if (results.length === 0) {
                            return res.status(400).json({ error: 'The appointment does not fall within the doctor\'s schedule.' });
                        }

                        // Check if the appointment is unique
                        connection.query('SELECT * FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND start_time = ? AND end_time = ?', 
                            [doctorId, appointmentDate, startTime, endTime], (error, results) => {
                                if (error) {
                                    console.error('Error checking uniqueness of appointment: ' + error);
                                    return res.status(500).json({ error: 'An error occurred while checking the uniqueness of the appointment.' });
                                }

                                if (results.length > 0) {
                                    return res.status(400).json({ error: 'An appointment already exists for the specified time slot.' });
                                }

                                // Insert the appointment record into the database
                                connection.query('INSERT INTO appointments (user_id, doctor_id, appointment_date, start_time, end_time, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                                    [userId, doctorId, appointmentDate, startTime, endTime, reason, 'Scheduled'],
                                    (error, results) => {
                                        if (error) {
                                            console.error('Error creating appointment: ' + error);
                                            return res.status(500).json({ error: 'An error occurred while creating the appointment.' });
                                        }
                                        console.log('Appointment created successfully.');
                                        return res.status(201).json({ message: 'Appointment created successfully.', appointmentId: results.insertId });
                                    });
                            });
                    });
            });
    } catch (error) {
        console.error('Error creating appointment: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};



exports.getAppointmentsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const query = `
            SELECT 
                a.*, 
                d.doctor_name, 
                d.doctor_image, 
                d.specialty 
            FROM 
                appointments a
            JOIN 
                doctors d ON a.doctor_id = d.doctor_id
            WHERE 
                a.user_id = ?;
        `;

        connection.query(query, [userId], (error, results) => {
            if (error) {
                console.error('Error getting appointments by user ID: ' + error);
                return res.status(500).json({ error: 'An error occurred while fetching appointments.' });
            }
            console.log('Appointments fetched successfully.');
            return res.status(200).json({ appointments: results });
        });
    } catch (error) {
        console.error('Error getting appointments by user ID: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

exports.getAvailableTimeSlots = async (req, res) => {
    try {
        const { doctorId, appointmentDate } = req.params;
        const appointmentDayOfWeek = new Date(appointmentDate).getDay();

        // Fetch the doctor's schedule for the specific day of the week
        connection.query('SELECT start_time, end_time, slot_duration FROM schedules WHERE doctor_id = ? AND day_of_week = ?', [doctorId, appointmentDayOfWeek], (scheduleError, scheduleResults) => {
            if (scheduleError) {
                console.error('Error fetching schedule for doctor: ' + scheduleError);
                return res.status(500).json({ error: 'An error occurred while fetching the doctor\'s schedule.' });
            }

            if (scheduleResults.length === 0) {
                return res.status(404).json({ error: 'No schedule found for the doctor on the chosen day.' });
            }

            const { start_time: scheduleStartTime, end_time: scheduleEndTime, slot_duration } = scheduleResults[0];

            // Fetch existing appointments for the given doctor on the chosen date
            connection.query('SELECT start_time, end_time FROM appointments WHERE doctor_id = ? AND appointment_date = ?', [doctorId, appointmentDate], (appointmentError, appointmentResults) => {
                if (appointmentError) {
                    console.error('Error fetching appointments for doctor on chosen date: ' + appointmentError);
                    return res.status(500).json({ error: 'An error occurred while fetching appointments.' });
                }

                console.log('Appointments fetched successfully.');

                // Generate available time slots based on the schedule and exclude occupied slots
                const availableTimeSlots = [];
                let currentTime = new Date(`${appointmentDate}T${scheduleStartTime}`);

                while (currentTime < new Date(`${appointmentDate}T${scheduleEndTime}`)) {
                    const slotEndTime = new Date(currentTime.getTime() + slot_duration * 60000); // Adding slot duration in minutes

                    // Check if the current slot is already occupied
                    const isOccupied = appointmentResults.some(appointment => {
                        const appointmentStartTime = new Date(`${appointmentDate}T${appointment.start_time}`);
                        const appointmentEndTime = new Date(`${appointmentDate}T${appointment.end_time}`);
                        return currentTime >= appointmentStartTime && currentTime < appointmentEndTime;
                    });

                    if (!isOccupied) {
                        availableTimeSlots.push({ start_time: currentTime.toTimeString().slice(0, 5), end_time: slotEndTime.toTimeString().slice(0, 5) });
                    }

                    currentTime = slotEndTime;
                }

                console.log('Available time slots fetched successfully.');
                return res.status(200).json({ availableTimeSlots });
            });
        });
    } catch (error) {
        console.error('Error fetching available time slots: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};


exports.getAppointmentsByDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        connection.query('SELECT * FROM doctors WHERE doctor_id = ? AND role = "doctor"', [doctorId], (error, doctorResults) => {
            if (error) {
                console.error('Error checking doctor role: ' + error);
                return res.status(500).json({ error: 'An error occurred while checking doctor role.' });
            }

            if (doctorResults.length === 0) {
                return res.status(400).json({ error: 'The specified doctor does not exist or is not a doctor.' });
            }

            connection.query(`
                SELECT appointments.*, user.*
                FROM appointments
                INNER JOIN user ON appointments.user_id = user.userid
                WHERE appointments.doctor_id = ?
            `, [doctorId], (error, results) => {
                if (error) {
                    console.error('Error getting appointments by doctor ID: ' + error);
                    return res.status(500).json({ error: 'An error occurred while fetching appointments.' });
                }
                console.log('Appointments fetched successfully.');
                return res.status(200).json({ appointments: results });
            });
        });
    } catch (error) {
        console.error('Error getting appointments by doctor ID: ' + error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};
