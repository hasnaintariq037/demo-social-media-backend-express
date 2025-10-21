import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    const mailOptions = {
      from: `"Demo Social Media App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error("Email could not be sent");
  }
};
