const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOtpEmail = async (email, otp) => {
  const msg = {
    to: email,
    from: "mentora.noreply@gmail.com",
    subject: "Mentora OTP Verification",
    html: `
      <h2>Mentora OTP Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP expires in 10 minutes.</p>
    `,
  };

  await sgMail.send(msg);
};

module.exports = sendOtpEmail;