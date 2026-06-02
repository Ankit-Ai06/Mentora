import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaTimes,
  FaArrowLeft,
  FaCheckCircle,
} from "react-icons/fa";

import { API_URL } from "../config";

const API = API_URL;

// ─── FORGOT PASSWORD MODAL (3 steps) ─────────────────────────────

function ForgotPasswordModal({ onClose }) {
  // step: "email" | "otp" | "reset" | "done"
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtpHint, setDevOtpHint] = useState(""); // shown when email not configured
  const [resendTimer, setResendTimer] = useState(0);

  // ── OTP input handling ──────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  // ── Step 1: send OTP ────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email.trim()) return setError("Please enter your email");
    setError("");
    setDevOtpHint("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/forgot-password/send-otp`, { email });
      setStep("otp");
      startResendTimer();
      // Dev mode: backend returns OTP directly when email is not configured
      if (res.data.devOtp) {
        setDevOtpHint(res.data.devOtp);
        setOtp(res.data.devOtp.split(""));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    }
    setLoading(false);
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // ── Step 2: verify OTP ──────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length < 6) return setError("Enter the full 6-digit OTP");
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/forgot-password/verify-otp`, {
        email,
        otp: code,
      });
      setResetToken(res.data.resetToken);
      setStep("reset");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    }
    setLoading(false);
  };

  // ── Step 3: reset password ──────────────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword) return setError("Enter a new password");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password/reset`, {
        resetToken,
        newPassword,
      });
      setStep("done");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    }
    setLoading(false);
  };

  // ── Shared input style ──────────────────────────────────────────
  const inputClass =
    "w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-gray-400 outline-none focus:border-cyan-400/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
        >
          <FaTimes />
        </button>

        {/* ── DONE ── */}
        {step === "done" && (
          <div className="text-center py-6">
            <FaCheckCircle className="text-cyan-400 text-6xl mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-2">Password Reset!</h2>
            <p className="text-gray-400 mb-8">
              Your password has been changed successfully. You can now log in.
            </p>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold text-lg hover:scale-[1.02] transition-all"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* ── STEP: EMAIL ── */}
        {step === "email" && (
          <>
            <div className="mb-7">
              <h2 className="text-3xl font-black text-white mb-1">Forgot Password?</h2>
              <p className="text-gray-400 text-sm">
                Enter your registered email. We'll send a 6-digit OTP to reset your password.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-400/30 text-red-300 rounded-2xl px-4 py-3 mb-5 text-sm">
                {error}
              </div>
            )}

            <div className="relative mb-5">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                className="w-full bg-white/10 border border-white/10 rounded-2xl pl-11 pr-5 py-3.5 text-white placeholder-gray-400 outline-none focus:border-cyan-400/50 transition-colors"
              />
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold text-lg hover:scale-[1.02] transition-all disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {/* ── STEP: OTP ── */}
        {step === "otp" && (
          <>
            <button
              onClick={() => { setStep("email"); setError(""); }}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm"
            >
              <FaArrowLeft size={12} /> Back
            </button>

            <div className="mb-7">
              <h2 className="text-3xl font-black text-white mb-1">Enter OTP</h2>
              <p className="text-gray-400 text-sm">
                We sent a 6-digit code to <span className="text-cyan-400">{email}</span>
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-400/30 text-red-300 rounded-2xl px-4 py-3 mb-5 text-sm">
                {error}
              </div>
            )}

            {/* Dev hint banner */}
            {devOtpHint && (
              <div className="bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 rounded-2xl px-4 py-3 mb-4 text-sm text-center">
                <span className="font-bold">Dev mode:</span> Email not configured —{" "}
                OTP auto-filled: <span className="font-mono font-bold tracking-widest">{devOtpHint}</span>
              </div>
            )}

            {/* OTP boxes */}
            <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-white/10 border border-white/10 rounded-2xl text-white outline-none focus:border-cyan-400 focus:bg-cyan-400/10 transition-all"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold text-lg hover:scale-[1.02] transition-all disabled:opacity-60 mb-4"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            {/* Resend */}
            <p className="text-center text-sm text-gray-400">
              Didn't receive it?{" "}
              {resendTimer > 0 ? (
                <span className="text-cyan-400">Resend in {resendTimer}s</span>
              ) : (
                <button
                  onClick={() => { handleSendOTP(); setOtp(["","","","","",""]); }}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Resend OTP
                </button>
              )}
            </p>
          </>
        )}

        {/* ── STEP: RESET ── */}
        {step === "reset" && (
          <>
            <div className="mb-7">
              <h2 className="text-3xl font-black text-white mb-1">New Password</h2>
              <p className="text-gray-400 text-sm">Create a strong new password for your account.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-400/30 text-red-300 rounded-2xl px-4 py-3 mb-5 text-sm">
                {error}
              </div>
            )}

            {/* New password */}
            <div className="relative mb-4">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showNew ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-2xl pl-11 pr-12 py-3.5 text-white placeholder-gray-400 outline-none focus:border-cyan-400/50 transition-colors"
              />
              <button
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Confirm password */}
            <div className="relative mb-6">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                className="w-full bg-white/10 border border-white/10 rounded-2xl pl-11 pr-12 py-3.5 text-white placeholder-gray-400 outline-none focus:border-cyan-400/50 transition-colors"
              />
              <button
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Password strength hint */}
            {newPassword && (
              <div className="flex gap-1 mb-4">
                {[1,2,3,4].map((lvl) => {
                  const strength =
                    newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? 4
                    : newPassword.length >= 8 && /\d/.test(newPassword) ? 3
                    : newPassword.length >= 6 ? 2
                    : 1;
                  return (
                    <div
                      key={lvl}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        lvl <= strength
                          ? strength === 1 ? "bg-red-400"
                          : strength === 2 ? "bg-yellow-400"
                          : strength === 3 ? "bg-cyan-400"
                          : "bg-green-400"
                          : "bg-white/10"
                      }`}
                    />
                  );
                })}
              </div>
            )}

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold text-lg hover:scale-[1.02] transition-all disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(`${API}/api/auth/login`, formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Login Failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4">

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[32px] p-8 shadow-2xl">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-3xl font-black text-white mb-3">
              M
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Mentora
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Connect. Collaborate. Grow.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-400/30 text-red-300 rounded-2xl px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                required
                className="w-full bg-white/10 border border-white/10 rounded-2xl pl-11 pr-5 py-3.5 text-white placeholder-gray-400 outline-none focus:border-cyan-400/50 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="w-full bg-white/10 border border-white/10 rounded-2xl pl-11 pr-12 py-3.5 text-white placeholder-gray-400 outline-none focus:border-cyan-400/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-cyan-400 text-sm hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold text-lg hover:scale-[1.02] transition-all duration-300 shadow-xl disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          {/* Signup link */}
          <p className="text-center mt-6 text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-cyan-400 font-semibold hover:underline">
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;
