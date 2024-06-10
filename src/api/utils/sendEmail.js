const nodemailer = require('nodemailer');
require('dotenv').config();


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Subject of the email
 * @param {string} text - Plain text body of the email
 * @returns {Promise} - A Promise that resolves when the email is sent
 */
function sendEmail(to, subject, text) {
    const mailOptions = {
        from: process.env.EMAIL,
        to: to,
        subject: subject,
        text: text
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                resolve(info.response);
            }
        });
    });
}

module.exports = sendEmail;
