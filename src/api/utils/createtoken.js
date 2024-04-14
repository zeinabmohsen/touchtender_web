const jwt = require('jsonwebtoken');

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRATION,
  });

module.exports = createToken;
