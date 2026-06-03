const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Mentora <onboarding@resend.dev>",
      to: email,
      subject: "Mentora OTP Verification",
      html: `
        <h2>Mentora OTP Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
      `,
    });

    console.log("OTP email sent successfully");
    return true;
  } catch (error) {
    console.log("Resend email error:", error.message);
    return false;
  }
};

module.exports = sendOtpEmail;