const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const createToken = require("../utils/createtoken");
const connection = require("../../config/database");

// Define a function to hash passwords

// const hashPassword = async (password) => {
//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);
//     return hashedPassword;
// };

// const comparePasswords = async (password, hashedPassword) => {
//     return await bcrypt.compare(password, hashedPassword);
// };


exports.signUp = async (req, res) => {
    try {
        const { email, password, fullName, gender } = req.body;

        
        connection.query('SELECT * FROM user WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            
            if (results.length > 0) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            connection.query('INSERT INTO user (email, password, fullName, gender) VALUES (?, ?, ?, ?)', [email, password, fullName, gender], (error, insertResult) => {
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
                    gender: gender
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
                return res.status(500).json({ error: 'Internal Server Error' });
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
            console.log(user.userid)
                // Generate token
                const token = createToken(user.userid);

            // Send the generated JWT in the response
            res.json({ token });
        });
    } catch (err) {
        console.error(err);
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


