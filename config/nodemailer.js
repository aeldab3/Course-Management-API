const nodemailer = require("nodemailer");

// Create a transporter using Gmail's SMTP server
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

const sendMail = async({to, subject, html}) => {
    const mailOptions = {
        from: `"Course Management API" <${process.env.EMAIL}>`,
        to,
        subject,
        html
    };
    await transporter.sendMail(mailOptions);
};

module.exports = sendMail;