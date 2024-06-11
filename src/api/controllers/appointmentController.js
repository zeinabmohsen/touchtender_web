const connection = require("../../config/database");

// Function to create an appointment
exports.createAppointment = async (req, res) => {
    try {
        const { userId, doctorId, appointmentDate, startTime, endTime, reason } = req.body;

        // Check if the user already has an appointment with the specified doctor
        connection.query('SELECT * FROM appointments WHERE user_id = ? AND doctor_id = ? AND status != "Cancelled"', 
            [userId, doctorId], (error, results) => {
                if (error) {
                    console.error('Error checking user appointments: ' + error);
                    return res.status(500).json({ error: 'An error occurred while checking user appointments.' });
                }

                if (results.length > 0) {
                    return res.status(400).json({ error: 'You already have an appointment with this doctor.' });
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


// Function to get appointments by user ID
exports.getAppointmentsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch appointments for the given user from the database
        connection.query('SELECT * FROM appointments WHERE user_id = ?', [userId], (error, results) => {
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

// Function to fetch available time slots for a doctor on a chosen date
exports.getAvailableTimeSlots = async (req, res) => {
    try {
        const { doctorId, appointmentDate } = req.params;

        // Fetch existing appointments for the given doctor on the chosen date
        connection.query('SELECT start_time, end_time FROM appointments WHERE doctor_id = ? AND appointment_date = ?', [doctorId, appointmentDate], (error, results) => {
            if (error) {
                console.error('Error fetching appointments for doctor on chosen date: ' + error);
                return res.status(500).json({ error: 'An error occurred while fetching appointments.' });
            }
            console.log('Appointments fetched successfully.');

            // Assuming time slots are available every 30 minutes from 8 AM to 4 PM
            const availableTimeSlots = [];
            let currentTime = new Date(`${appointmentDate}T08:00:00`);

            while (currentTime <= new Date(`${appointmentDate}T16:00:00`)) {
                const slotEndTime = new Date(currentTime.getTime() + 30 * 60000); // Adding 30 minutes

                // Check if the current slot is already occupied
                const isOccupied = results.some(appointment => {
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