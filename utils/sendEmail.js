const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    // Create a transporter using standard SMTP (configure variables in .env)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || 587,
        auth: {
            user: process.env.EMAIL_USER,    // Your email address
            pass: process.env.EMAIL_PASS     // Your email password or app password
        }
    });

    const mailOptions = {
        from: `Real Estate Platform <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.htmlMessage || options.message, // Fallback to text if missing
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
