require('dotenv').config(); // Load environment variables
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const createToken = require("../utils/createtoken");
const connection = require("../../config/database");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');
const sendEmail = require('../utils/sendEmail');
const { promisify } = require('util');

// Promisify the MySQL query method
const query = promisify(connection.query).bind(connection);

// Function to get IP location
async function getIpLocation(ip) {
    const { default: fetch } = await import('node-fetch'); // Dynamic import
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return data;
}

const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "184946057fde0e",
        pass: "f90af2abe10514"
    }
});

async function sendLoginEmail(userEmail, location) {
    const mailOptions = {
        from: 'zainabhmohsen@email.com', // Change this to your email address
        to: userEmail,
        subject: 'Login Alert',
        text: `You have logged in from IP address: ${location.query} located in ${location.city}, ${location.regionName}, ${location.country}.`
    };

    try {
        await transport.sendMail(mailOptions);
        console.log('Login email sent successfully');
    } catch (error) {
        console.error('Error sending login email:', error);
    }
}

exports.login2 = async (req, res) => {
    try {
        const { email, password } = req.body;

        const results = await query('SELECT * FROM user WHERE email = ?', [email]);

        if (!results || results.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const user = results[0];

        // Compare passwords
        if (password !== user.password) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.userid }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

        // Send both token and user ID in the response
        res.json({ success: true, token, userId: user.userid });

        // Get the user's IP address
        const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log('User IP:', userIp); // Log the IP address

        // Get the IP location
        const location = await getIpLocation(userIp);

      
    } catch (err) {
        console.error('Error during login process:', err);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

exports.loginWeb = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Query the doctors table instead of the user table
      const results = await query('SELECT * FROM doctors WHERE email = ?', [email]);
  
      if (!results || results.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
  
      const doctor = results[0];
  
      // Compare passwords
      if (password !== doctor.password) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
  
      // Generate token
      const token = jwt.sign({ doctorId: doctor.id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
  
      // Send both token and doctor ID in the response
      res.json({ success: true, token, userId: doctor.doctor_id , role:doctor.role});
  
  
    } catch (err) {
      console.error('Error during login process:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };
  




const storage = multer.diskStorage({
    destination: 'uploads/users',
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        const filename = `user-${uuidv4()}.${ext}`;
        cb(null, filename);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image') || ['image/png', 'image/jpeg', 'image/jfif'].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only Images Allowed'), false);
    }
};

exports.uploadImage = multer({ storage, fileFilter }).single('user_image');

exports.signUp = async (req, res) => {
    try {
        const { email, password, fullName, gender } = req.body;

        connection.query('SELECT * FROM user WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            let imageUrl = ""; 
            // Check if file is uploaded
            if (req.file) {
                imageUrl = `/uploads/users/${req.file.filename}`; // Set imageUrl to file path
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            connection.query('INSERT INTO user (email, password, fullName, gender, image_url) VALUES (?, ?, ?, ?, ?)', [email, password, fullName, gender, imageUrl], (error, insertResult) => {
                if (error) {
                    console.error('Error creating user: ' + error);
                    return res.status(500).json({ error: 'An error occurred while creating the user.' });
                }

                console.log('New user added successfully.');

                const userId = insertResult.insertId;

                const newUser = {
                    id: userId,
                    email: email,
                    fullName: fullName,
                    gender: gender,
                    imageUrl: imageUrl
                };

                const token = createToken(userId);
                res.status(201).json({ message: 'User created successfully.', user: newUser, token });
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.logout = (req, res) => {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



exports.protect = (req, res, next) => {
    try {
        // 1) Check if token exists
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            throw new Error("You are not logged in. Please log in to access this route");
        }

        // 2) Verify token
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
            if (err) {
                throw new Error("Invalid token");
            }

            // 3) Check if user exists in the database
            connection.query('SELECT * FROM user WHERE userid = ?', [decoded.userId], (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                // Handle user not found gracefully
                if (!results || !results.length) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                const currentUser = results[0];

                // Attach the user object to the request object
                req.user = currentUser;

                next();
            });
        });
    } catch (error) {
        res.status(401).json({ message: error.message || "Unauthorized" });
    }
};


exports.getUserById = async (req, res) => {
    try {
      const { id } = req.params;
  
      connection.query('SELECT * FROM user WHERE userid = ?', [id], (error, results) => {
        if (error) {
          console.error('Error getting user by ID: ' + error);
          return res.status(500).json({ error: 'An error occurred while fetching the user.' });
        }
  
        if (results.length === 0) {
          return res.status(404).json({ error: 'User not found.' });
        }
  
        console.log('User fetched successfully.');
        return res.status(200).json({ user: results[0] });
      });
    } catch (error) {
      console.error('Error getting user by ID: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };
  

  exports.updateUserById = async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, email, gender, role } = req.body;
        connection.query(
        'UPDATE user SET fullName = ?, email = ?, gender = ?, role = ? WHERE userid = ?',
        [fullName, email, gender, role, id],
        (error, results) => {
          if (error) {
            console.error('Error updating user: ' + error);
            return res.status(500).json({ error: 'An error occurred while updating the user.' });
          }
  
          if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found.' });
          }
  
          console.log('User updated successfully.');
  
          const updatedUser = {
            userid: id,
            fullName: fullName,
            email: email,
            gender: gender,
            role: role,
          };
  
          return res.status(200).json({ message: 'User updated successfully.', user: updatedUser });
        }
      );
    } catch (error) {
      console.error('Error updating user: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };

  function generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000); 
}


/**
* Handle forgot password request
*/
exports.forgotPassword = (req, res) => {
    const { email } = req.body;

    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 3600000); 

    connection.query('SELECT userid FROM user WHERE email = ?', [email], (err, result) => {
        if (err) {
            console.error('Error selecting user:', err);
            return res.status(500).send('Server error');
        }
        
        if (result.length === 0) {
            return res.status(404).send('User not found');
        }

        const userId = result[0].userid;
        const token = jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });

        sendEmail(email, 'Reset Your TenderTouch App Password', `
            We understand how crucial TenderTouch is for your child's needs. To ensure uninterrupted access, here's your verification code:
            
            Verification Code: ${resetCode}
            
            If you need assistance, we're here to help.
            
            Best,
            TenderTouch Support Team
        `)
        .then(() => {
            // Send the JWT token back to the client
            res.json({ token, message: 'Verification code sent to your email' });
        })
        .catch(error => {
            console.error('Error sending email:', error);
            res.status(500).send('Error sending email');
        });
    });
};

/**
* Handle reset password request
*/
exports.resetPassword = (req, res) => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
        return res.status(400).send('User ID and new password are required');
    }

    connection.query('UPDATE user SET password = ? WHERE userid = ?', [newPassword, userId], (err) => {
        if (err) {
            console.error('Error updating password:', err);
            return res.status(500).send('Server error');
        }

        res.send('Password reset successfully');
    });
};

/**
* Verify the reset code
*/
exports.verifyResetCode = (req, res) => {
    const { code } = req.body;

    connection.query('SELECT user_id, expires_at FROM password_resets WHERE reset_code = ?', [code], (err, result) => {
        if (err) return res.status(500).send('Server error');
        if (result.length === 0) return res.status(400).send('Invalid or expired code');

        const { expires_at } = result[0];

        if (Date.now() > new Date(expires_at)) {
            return res.status(400).send('Code expired');
        }

        res.send('Code is valid');
    });
};
