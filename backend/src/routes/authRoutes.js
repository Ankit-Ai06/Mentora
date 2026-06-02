const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  registerUser, loginUser,
  checkPhone, checkEmail,
  sendSignupOTP, verifySignupOTP,
  sendOTP, verifyOTP, resetPassword,
  changePassword,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/check-phone", checkPhone);
router.post("/check-email", checkEmail);
router.post("/signup/send-otp", sendSignupOTP);
router.post("/signup/verify-otp", verifySignupOTP);
router.post("/forgot-password/send-otp", sendOTP);
router.post("/forgot-password/verify-otp", verifyOTP);
router.post("/forgot-password/reset", resetPassword);
router.put("/change-password", protect, changePassword);

module.exports = router;
