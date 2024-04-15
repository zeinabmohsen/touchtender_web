const connection = require("../../config/database");

exports.createDoctor = async (req, res) => {
    try {
      const { doctor_name, specialty, number, description } = req.body;
  
      // Validate user input
      if (!doctor_name || !specialty || !number || !description) {
        return res.status(400).json({ error: 'All fields are required.' });
      }
  
      // Insert new doctor record into the database
      connection.query('INSERT INTO doctors (doctor_name, specialty, number, description) VALUES (?, ?, ?, ?)', [doctor_name, specialty, number, description], (error, results) => {
        if (error) {
          console.error('Error creating doctor: ' + error);
          return res.status(500).json({ error: 'An error occurred while creating the doctor.' });
        }
  
        console.log('New doctor added successfully.');
  
        const doctorId = results.insertId;
  
        const newDoctor = {
          id: doctorId,
          doctor_name: doctor_name,
          specialty: specialty,
          number: number,
          description: description
        };
  
        return res.status(201).json({ message: 'Doctor created successfully.', doctor: newDoctor });
      });
    } catch (error) {
      console.error('Error creating doctor: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };
  
  // Function to update an existing doctor record
  exports.updateDoctor = async (req, res) => {
    try {
      const { id } = req.params;
      const { doctor_name, specialty, number, description } = req.body;
  
      // Update the doctor record in the database
      connection.query('UPDATE doctors SET doctor_name = ?, specialty = ?, number = ?, description = ? WHERE doctor_id = ?', [doctor_name, specialty, number, description, id], (error, results) => {
        if (error) {
          console.error('Error updating doctor: ' + error);
          return res.status(500).json({ error: 'An error occurred while updating the doctor.' });
        }
  
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Doctor not found.' });
        }
  
        console.log('Doctor updated successfully.');
  
        const updatedDoctor = {
          id: id,
          doctor_name: doctor_name,
          specialty: specialty,
          number: number,
          description: description
        };
  
        return res.status(200).json({ message: 'Doctor updated successfully.', doctor: updatedDoctor });
      });
    } catch (error) {
      console.error('Error updating doctor: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };

  // Function to delete a doctor by ID
exports.deleteDoctor = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Delete the doctor record from the database
      connection.query('DELETE FROM doctors WHERE doctor_id = ?', [id], (error, results) => {
        if (error) {
          console.error('Error deleting doctor: ' + error);
          return res.status(500).json({ error: 'An error occurred while deleting the doctor.' });
        }
  
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Doctor not found.' });
        }
  
        console.log('Doctor deleted successfully.');
        return res.status(200).json({ message: 'Doctor deleted successfully.' });
      });
    } catch (error) {
      console.error('Error deleting doctor: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };
  
  // Function to get all doctors
  exports.getAllDoctors = async (req, res) => {
    try {
      // Fetch all doctor records from the database
      connection.query('SELECT * FROM doctors', (error, results) => {
        if (error) {
          console.error('Error getting all doctors: ' + error);
          return res.status(500).json({ error: 'An error occurred while fetching all doctors.' });
        }
  
        console.log('All doctors fetched successfully.');
        return res.status(200).json({ doctors: results });
      });
    } catch (error) {
      console.error('Error getting all doctors: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };
  
  // Function to get a doctor by ID
  exports.getDoctorById = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Fetch the doctor record from the database by ID
      connection.query('SELECT * FROM doctors WHERE doctor_id = ?', [id], (error, results) => {
        if (error) {
          console.error('Error getting doctor by ID: ' + error);
          return res.status(500).json({ error: 'An error occurred while fetching the doctor.' });
        }
  
        if (results.length === 0) {
          return res.status(404).json({ error: 'Doctor not found.' });
        }
  
        console.log('Doctor fetched successfully.');
        return res.status(200).json({ doctor: results[0] });
      });
    } catch (error) {
      console.error('Error getting doctor by ID: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };
  