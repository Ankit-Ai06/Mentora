const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dns = require("dns").promises;
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);


// ─── IN-MEMORY OTP STORES ─────────────────────────────────────────
const otpStore = new Map();
const signupOtpStore = new Map();

// ─── HELPERS ──────────────────────────────────────────────────────
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const otpHtml = (otpCode, heading, sub) => `
  <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
       background:#0f172a;color:#fff;border-radius:16px;">
    <h2 style="color:#22d3ee;margin-bottom:4px;">Mentora</h2>
    <p style="color:#94a3b8;margin-bottom:20px;">${sub}</p>
    <p style="margin-bottom:8px;">${heading} — expires in <strong>10 minutes</strong>.</p>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;
         padding:24px;text-align:center;margin:20px 0;">
      <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#22d3ee;">${otpCode}</span>
    </div>
    <p style="color:#64748b;font-size:13px;">If you didn't request this, ignore this email.</p>
  </div>`;

// ─── SEND EMAIL HELPER ────────────────────────────────────────────
const trySendEmail = async (to, subject, html, otpCode) => {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Mentora <onboarding@resend.dev>",
    to,
    subject,
    html,
    text: `Your Mentora OTP code is: ${otpCode}. It expires in 10 minutes.`,
  });

  console.log(`✅ OTP email sent to ${to}`);
  return true;
};

// ─── DNS EMAIL DOMAIN CHECK ───────────────────────────────────────
const isEmailDomainReal = async (email) => {
  try {
    const domain = email.split("@")[1];
    if (!domain) return false;
    const result = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DNS_TIMEOUT")), 3000)
      ),
    ]);
    const valid = Array.isArray(result) && result.length > 0;
    console.log(`[DNS] ${domain} → ${valid ? "✅ valid" : "❌ no MX records"}`);
    return valid;
  } catch (err) {
    if (err.message === "DNS_TIMEOUT") {
      console.warn(`[DNS] Timeout — allowing through`);
      return true;
    }
    if (["ENOTFOUND", "ENODATA", "ESERVFAIL"].includes(err.code)) {
      console.log(`[DNS] ${email.split("@")[1]} → ❌ ${err.code}`);
      return false;
    }
    console.warn(`[DNS] Unexpected error: ${err.message} — allowing through`);
    return true;
  }
};

// ─── CHECK PHONE DUPLICATE ────────────────────────────────────────
const checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.json({ taken: false });
    const user = await User.findOne({ phone: phone.trim() });
    res.json({ taken: !!user });
  } catch { res.json({ taken: false }); }
};

// ─── CHECK EMAIL DUPLICATE ────────────────────────────────────────
const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ taken: false });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    res.json({ taken: !!user });
  } catch { res.json({ taken: false }); }
};

// ─── SEND SIGNUP OTP ──────────────────────────────────────────────
const sendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`\n[SIGNUP OTP] Request for: "${email}"`);
    if (!email) return res.status(400).json({ message: "Email is required" });

    const emailLower = email.trim().toLowerCase();

    // 1. Already registered?
    const exists = await User.findOne({ email: emailLower });
    if (exists) {
      console.log(`[SIGNUP OTP] ❌ Already registered`);
      return res.status(400).json({ message: "This email is already registered. Try logging in." });
    }

    // 2. Real domain? (DNS MX check)
    const domainReal = await isEmailDomainReal(emailLower);
    if (!domainReal) {
      console.log(`[SIGNUP OTP] ❌ Domain failed MX check`);
      return res.status(400).json({
        message: "This doesn't look like a real email address. Please use a valid email (e.g. you@gmail.com).",
      });
    }

    // 3. Generate OTP
    const otpCode = generateOTP();
    signupOtpStore.set(emailLower, { otp: otpCode, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.log(`[SIGNUP OTP] 🔑 OTP: ${otpCode}`);

    // 4. Send email
    const sent = await trySendEmail(
      email,
      "Verify your Mentora account",
      otpHtml(otpCode, "Your email verification code", "Email Verification"),
      otpCode
    );

  res.json({
  message: "OTP sent to your email",
});
  } catch (err) {
    console.error("[SIGNUP OTP] ❌ Error:", err.message);
    res.status(500).json({ message: "Failed to send OTP: " + err.message });
  }
};

// ─── VERIFY SIGNUP OTP ────────────────────────────────────────────
const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const stored = signupOtpStore.get(email.toLowerCase());
    if (!stored) return res.status(400).json({ message: "No OTP found. Please request a new one." });
    if (Date.now() > stored.expiresAt) {
      signupOtpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }
    if (stored.otp !== String(otp).trim())
      return res.status(400).json({ message: "Incorrect OTP. Try again." });

    const verifyToken = jwt.sign(
      { email: email.toLowerCase(), purpose: "signup" },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );
    signupOtpStore.delete(email.toLowerCase());
    res.json({ message: "Email verified successfully", verifyToken });
  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
};

// ─── REGISTER USER ────────────────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { fullName, phone, email, dob, role, password, verifyToken } = req.body;

    // Validate email verifyToken
    let decoded;
    try {
      decoded = jwt.verify(verifyToken, process.env.JWT_SECRET);
    } catch (e) {
      const msg = e.name === "TokenExpiredError"
        ? "Your email verification has expired (30 min limit). Please go back and verify your email again."
        : "Email verification is invalid. Please go back to Step 1 and verify your email again.";
      return res.status(400).json({ message: msg });
    }
    if (decoded.purpose !== "signup" || decoded.email !== email.toLowerCase()) {
      return res.status(400).json({ message: "Email verification mismatch. Please start over from Step 1." });
    }

    // Duplicate checks
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: "This email is already registered." });

    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) return res.status(400).json({ message: "This phone number is already registered." });

    // Role check
    const VALID_ROLES = ["Student", "Professional"];
    const cleanRole = role ? role.trim() : "";
    if (!VALID_ROLES.includes(cleanRole)) {
      return res.status(400).json({ message: `Role must be Student or Professional` });
    }

    // Age check (18+)
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return res.status(400).json({ message: "Invalid date of birth." });
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age--;
    if (age < 18) return res.status(400).json({ message: "You must be at least 18 years old to register." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      dob,
      role: cleanRole,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ message: "Account created successfully!", token, user });
  } catch (err) {
    console.error("registerUser error:", err.message);
    res.status(500).json({ message: err.message || "Registration failed. Please try again." });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: "No account found with this email." });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password. Please try again." });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ message: "Login Successful", token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── FORGOT PASSWORD: SEND OTP ────────────────────────────────────
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const emailLower = email.trim().toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(404).json({ message: "No account found with this email." });

    const otpCode = generateOTP();
    otpStore.set(emailLower, { otp: otpCode, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.log(`\n[RESET OTP] 🔑 OTP for ${email}: ${otpCode}\n`);

    const sent = await trySendEmail(
      email,
      "Your Mentora Password Reset OTP",
      otpHtml(otpCode, "Your password reset code", "Password Reset"),
      otpCode
    );

    res.json({
      message: sent ? "OTP sent to your email" : "OTP generated (check server console)",
      devOtp: !sent ? otpCode : undefined,
    });
  } catch (err) {
    console.error("sendOTP:", err.message);
    res.status(500).json({ message: "Failed to send OTP: " + err.message });
  }
};

// ─── FORGOT PASSWORD: VERIFY OTP ──────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const stored = otpStore.get(email.toLowerCase());
    if (!stored) return res.status(400).json({ message: "No OTP requested. Please request a new one." });
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }
    if (stored.otp !== String(otp).trim())
      return res.status(400).json({ message: "Incorrect OTP. Check and try again." });

    const resetToken = jwt.sign(
      { email: email.toLowerCase(), purpose: "reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    otpStore.delete(email.toLowerCase());
    res.json({ message: "OTP verified", resetToken });
  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
};

// ─── FORGOT PASSWORD: RESET ───────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    let decoded;
    try { decoded = jwt.verify(resetToken, process.env.JWT_SECRET); }
    catch { return res.status(400).json({ message: "Reset link expired. Please start over." }); }
    if (decoded.purpose !== "reset") return res.status(400).json({ message: "Invalid token." });
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: "User not found." });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// ─── CHANGE PASSWORD (logged in) ──────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "All fields required" });
    if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password" });
  }
};

module.exports = {
  registerUser, loginUser,
  checkPhone, checkEmail,
  sendSignupOTP, verifySignupOTP,
  sendOTP, verifyOTP, resetPassword,
  changePassword,
};
