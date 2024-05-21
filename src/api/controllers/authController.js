const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const createToken = require("../utils/createtoken");
const connection = require("../../config/database");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

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


exports.login2 = async (req, res) => {
    try {
        const { email, password } = req.body;

        connection.query('SELECT * FROM user WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            // Handle user not found gracefully
            if (!results || !results.length) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = results[0]; 

            // Compare passwords
            if (password !== user.password) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate token
            const token = createToken(user.userid);

            // Send both token and user ID in the response
            res.json({ success: true ,token, userId: user.userid });

            // Save token and user ID in localStorage
            // localStorage.setItem('token', token);
            // localStorage.setItem('userId', user.userid);
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
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
  
      // Fetch the user record from the database by ID
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
  
      // Update the user record in the database
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
  