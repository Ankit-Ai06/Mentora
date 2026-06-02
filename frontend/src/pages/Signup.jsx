import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUser, FaPhone, FaEnvelope, FaLock, FaCalendar,
  FaEye, FaEyeSlash, FaCheck, FaTimes, FaGraduationCap,
  FaBriefcase, FaArrowLeft, FaArrowRight, FaShieldAlt,
  FaExclamationCircle,
} from "react-icons/fa";

const API = "http://localhost:5000";

// ─── VALIDATORS ───────────────────────────────────────────────────
const isValidEmail = (v) =>
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v.trim());

// Must be 10-15 digits (spaces/dashes/+ allowed)
const isValidPhone = (v) => {
  const phone = v.trim();

  // With country code (+1, +44, +91, etc.) + exactly 10 digits
  if (/^\+\d{1,4}\d{10}$/.test(phone)) {
    return true;
  }

  // Without country code: exactly 10 digits
  return /^\d{10}$/.test(phone);
};

const getAge = (dob) => {
  if (!dob) return 0;
  const b = new Date(dob), t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t < new Date(t.getFullYear(), b.getMonth(), b.getDate())) age--;
  return age;
};

// Latest date allowed for 18+ (today minus 18 years)
const maxDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
})();

// ─── STEP PROGRESS ────────────────────────────────────────────────
function StepBar({ current, total }) {
  const labels = ["Details", "Verify", "Role", "Password"];
  return (
    <div className="flex items-center gap-1 mb-7">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className={`h-1 w-full rounded-full transition-all duration-500 ${
            i <= current ? "bg-cyan-400" : "bg-white/10"
          }`} />
          <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${
            i === current ? "text-cyan-400" : i < current ? "text-cyan-400/50" : "text-gray-700"
          }`}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── FIELD WRAPPER ────────────────────────────────────────────────
function Field({ label, error, success, checking, children }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-[2px] text-gray-500 mb-1.5">
          {label}
        </label>
      )}
      <div className={`flex items-center rounded-2xl border px-4 transition-all duration-200 ${
        error
          ? "border-red-400/60 bg-red-500/5"
          : success
          ? "border-green-400/50 bg-green-500/5"
          : "border-white/10 bg-white/5 focus-within:border-cyan-400/40 focus-within:bg-white/10"
      }`}>
        {children}
        <div className="ml-2 shrink-0 w-4 flex items-center justify-center">
          {checking
            ? <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-cyan-400 animate-spin" />
            : success
            ? <FaCheck className="text-green-400 text-[10px]" />
            : error
            ? <FaTimes className="text-red-400 text-[10px]" />
            : null}
        </div>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-red-400 text-[11px] mt-1.5 ml-1">
          <FaExclamationCircle size={9} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── INPUT STYLE ──────────────────────────────────────────────────
const inp = "flex-1 bg-transparent py-3.5 text-white placeholder-gray-600 outline-none text-sm min-w-0";

// ─── PASSWORD STRENGTH ────────────────────────────────────────────
function PwdStrength({ pwd }) {
  if (!pwd) return null;
  const rules = [
    { ok: pwd.length >= 8, label: "8+ characters" },
    { ok: /[A-Z]/.test(pwd), label: "Uppercase letter" },
    { ok: /[0-9]/.test(pwd), label: "Number (0–9)" },
    { ok: /[@$!%*?&]/.test(pwd), label: "Special char (!@#)" },
  ];
  const score = rules.filter(r => r.ok).length;
  const [color, word] = score <= 1
    ? ["bg-red-500", "Weak"]
    : score === 2
    ? ["bg-orange-400", "Fair"]
    : score === 3
    ? ["bg-yellow-400", "Good"]
    : ["bg-green-400", "Strong"];

  return (
    <div className="mb-3 px-1">
      <div className="flex gap-1 mb-1.5">
        {[1,2,3,4].map(l => (
          <div key={l} className={`h-1 flex-1 rounded-full transition-all ${l <= score ? color : "bg-white/10"}`} />
        ))}
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-500 text-[11px]">Password strength</span>
        <span className={`text-[11px] font-bold ${
          score <= 1 ? "text-red-400" : score === 2 ? "text-orange-400" : score === 3 ? "text-yellow-400" : "text-green-400"
        }`}>{word}</span>
      </div>
      <div className="grid grid-cols-2 gap-y-1">
        {rules.map(r => (
          <span key={r.label} className={`text-[11px] flex items-center gap-1 ${r.ok ? "text-green-400" : "text-gray-600"}`}>
            {r.ok ? <FaCheck size={7} /> : <FaTimes size={7} />} {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── ROLE CARD ────────────────────────────────────────────────────
function RoleCard({ icon, title, tagline, perks, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`relative w-full text-left rounded-3xl p-5 border cursor-pointer transition-all duration-300 select-none ${
        selected
          ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 shadow-lg shadow-cyan-500/10 scale-[1.01]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      }`}
    >
      {selected && (
        <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
          <FaCheck className="text-slate-900 text-[9px]" />
        </span>
      )}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 ${
        selected ? "bg-cyan-400/20 text-cyan-400" : "bg-white/10 text-gray-400"
      }`}>{icon}</div>
      <p className={`font-black text-lg leading-none mb-0.5 ${selected ? "text-white" : "text-gray-200"}`}>{title}</p>
      <p className={`text-xs mb-3 ${selected ? "text-cyan-300/80" : "text-gray-600"}`}>{tagline}</p>
      <ul className="space-y-1">
        {perks.map(p => (
          <li key={p} className="flex items-center gap-2 text-[11px] text-gray-500">
            <div className={`w-1 h-1 rounded-full ${selected ? "bg-cyan-400" : "bg-gray-700"}`} /> {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── OTP BOXES ────────────────────────────────────────────────────
function OtpBoxes({ value, onChange }) {
  const refs = useRef([]);

  const change = (v, i) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...value];
    next[i] = v.slice(-1);
    onChange(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const keydown = (e, i) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const paste = (e) => {
    e.preventDefault();
    const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (d.length === 6) { onChange(d.split("")); refs.current[5]?.focus(); }
  };

  return (
    <div className="flex justify-center gap-2.5 my-5" onPaste={paste}>
      {value.map((digit, i) => (
        <input
          key={i} ref={el => refs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1} value={digit}
          onChange={e => change(e.target.value, i)} onKeyDown={e => keydown(e, i)}
          className={`w-11 h-14 text-center text-2xl font-black rounded-2xl border outline-none transition-all bg-white/5 text-white ${
            digit ? "border-cyan-400 bg-cyan-500/10 shadow-sm shadow-cyan-500/20"
                  : "border-white/10 focus:border-cyan-400/50 focus:bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 details | 1 otp | 2 role | 3 password
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", dob: "",
    role: "", password: "", confirmPassword: "",
  });

  // duplicate checks
  const [phoneCheck, setPhoneCheck] = useState({ loading: false, taken: false });
  const [emailCheck, setEmailCheck] = useState({ loading: false, taken: false });

  // otp step
  const [otp, setOtp] = useState(["","","","","",""]);
  const [otpErr, setOtpErr] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState("");

  // password step
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);

  const setField = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setErrors(p => ({ ...p, [f]: "" }));
    if (f === "phone") setPhoneCheck(p => ({ ...p, taken: false }));
    if (f === "email") setEmailCheck(p => ({ ...p, taken: false }));
  };

  // ── Live phone check ──────────────────────────────────────────
  useEffect(() => {
    if (!isValidPhone(form.phone)) return;
    const t = setTimeout(async () => {
      setPhoneCheck({ loading: true, taken: false });
      try {
        const r = await axios.post(`${API}/api/auth/check-phone`, { phone: form.phone });
        setPhoneCheck({ loading: false, taken: r.data.taken });
      } catch { setPhoneCheck({ loading: false, taken: false }); }
    }, 700);
    return () => clearTimeout(t);
  }, [form.phone]);

  // ── Live email check ──────────────────────────────────────────
  useEffect(() => {
    if (!isValidEmail(form.email)) return;
    const t = setTimeout(async () => {
      setEmailCheck({ loading: true, taken: false });
      try {
        const r = await axios.post(`${API}/api/auth/check-email`, { email: form.email });
        setEmailCheck({ loading: false, taken: r.data.taken });
      } catch { setEmailCheck({ loading: false, taken: false }); }
    }, 700);
    return () => clearTimeout(t);
  }, [form.email]);

  // ── Resend countdown ──────────────────────────────────────────
  const startTimer = () => {
    setResendTimer(60);
    const iv = setInterval(() => setResendTimer(t => {
      if (t <= 1) { clearInterval(iv); return 0; }
      return t - 1;
    }), 1000);
  };

  // ── Step 0 validation ─────────────────────────────────────────
  const validate0 = () => {
    const e = {};
    if (!form.fullName.trim())
      e.fullName = "Full name is required";
    else if (form.fullName.trim().length < 2)
      e.fullName = "Name is too short";

    if (!form.phone.trim())
      e.phone = "Phone number is required";
    else if (!isValidPhone(form.phone))
      e.phone = "Enter a valid phone number with country code (e.g. +91 98765 43210)";
    else if (phoneCheck.taken)
      e.phone = "This number is already linked to an account";

    if (!form.email.trim())
      e.email = "Email address is required";
    else if (!isValidEmail(form.email))
      e.email = "Enter a valid email address (e.g. you@example.com)";
    else if (emailCheck.taken)
      e.email = "This email is already registered — try logging in";

    if (!form.dob)
      e.dob = "Date of birth is required";
    else if (getAge(form.dob) < 18)
      e.dob = "You must be at least 18 years old to create an account";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Send OTP ──────────────────────────────────────────────────
  const sendOTP = async () => {
    if (!validate0()) return;
    setLoading(true);
    setDevOtp("");
    try {
      const r = await axios.post(`${API}/api/auth/signup/send-otp`, { email: form.email });
      setStep(1);
      startTimer();
      if (r.data.devOtp) {
        setDevOtp(r.data.devOtp);
        setOtp(r.data.devOtp.split(""));
      }
    } catch (err) {
      setErrors({ email: err.response?.data?.message || "Could not send OTP. Try again." });
    }
    setLoading(false);
  };

  // ── Verify OTP ────────────────────────────────────────────────
  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length < 6) { setOtpErr("Please enter the complete 6-digit code"); return; }
    setOtpLoading(true);
    setOtpErr("");
    try {
      const r = await axios.post(`${API}/api/auth/signup/verify-otp`, { email: form.email, otp: code });
      setVerifyToken(r.data.verifyToken);
      setStep(2);
    } catch (err) {
      setOtpErr(err.response?.data?.message || "Incorrect OTP. Try again.");
      setOtp(["","","","","",""]);
    }
    setOtpLoading(false);
  };

  // ── Step 2 validation ─────────────────────────────────────────
  const validate2 = () => {
    if (!form.role) {
      setErrors({ role: "Please select your role to continue" });
      return false;
    }
    return true;
  };

  // ── Step 3 validation ─────────────────────────────────────────
  const validate3 = () => {
    const e = {};
    const strong = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!form.password)
      e.password = "Password is required";
    else if (!strong.test(form.password))
      e.password = "Password must have 8+ chars, an uppercase letter, a number and a special character";
    if (!form.confirmPassword)
      e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match — check and try again";
    if (!agreed)
      e.terms = "You must agree to the Terms & Conditions to create your account";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Final submit ──────────────────────────────────────────────
  const submit = async () => {
    if (!validate3()) return;
    setLoading(true);
    try {
      const r = await axios.post(`${API}/api/auth/register`, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.toLowerCase().trim(),
        dob: form.dob,
        role: form.role,          // "Student" or "Professional"
        password: form.password,
        verifyToken,
      });
      localStorage.setItem("token", r.data.token);
      localStorage.setItem("user", JSON.stringify(r.data.user));
      setDone(true);
      setTimeout(() => navigate("/home"), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      if (msg.toLowerCase().includes("phone")) {
        setErrors({ phone: msg }); setStep(0);
      } else if (msg.toLowerCase().includes("email")) {
        setErrors({ email: msg }); setStep(0);
      } else if (msg.toLowerCase().includes("verification") || msg.toLowerCase().includes("verify")) {
        // Token expired or invalid — send back to OTP step
        setVerifyToken("");
        setOtp(["","","","","",""]);
        setErrors({ general: msg });
        setStep(1);
      } else {
        setErrors({ general: msg });
      }
    }
    setLoading(false);
  };

  // ── Success screen ────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
      <div className="text-center px-8 animate-in fade-in duration-500">
        <div className="text-7xl mb-5 animate-bounce">🎉</div>
        <h2 className="text-4xl font-black text-white mb-2">You're in!</h2>
        <p className="text-cyan-400 font-semibold text-lg">Welcome to Mentora, {form.fullName.split(" ")[0]}.</p>
        <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-gray-600 border-t-cyan-400 animate-spin" />
          Taking you home…
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex">

      {/* ── LEFT PANEL (desktop only) ─────────────────────────── */}
      <div className="hidden lg:flex w-[42%] relative overflow-hidden flex-col justify-center p-14">
        <div className="absolute w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-3xl -top-20 -left-40 pointer-events-none" />
        <div className="absolute w-72 h-72 bg-blue-600/8 rounded-full blur-3xl bottom-10 right-0 pointer-events-none" />
        <div className="relative z-10 max-w-[340px]">
          <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl font-black text-slate-900 mb-10 shadow-xl shadow-cyan-500/20">
            M
          </div>
          <h1 className="text-6xl font-black text-white leading-none mb-4">
            Build<br />your<br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">network.</span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-10">
            Mentora connects students and professionals to learn, collaborate, and grow together.
          </p>
          <div className="space-y-4">
            {[
              { emoji: "🎓", t: "Students", d: "Find mentors, build your profile, get hired" },
              { emoji: "💼", t: "Professionals", d: "Give back, hire talent, grow your brand" },
              { emoji: "💬", t: "Everyone", d: "Real-time chat, posts, and connections" },
            ].map(({ emoji, t, d }) => (
              <div key={t} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">{emoji}</div>
                <div>
                  <p className="text-white font-bold text-sm">{t}</p>
                  <p className="text-gray-600 text-xs">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-5 overflow-y-auto">
        <div className="w-full max-w-[430px] py-8">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-[14px] bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xl font-black text-slate-900 mb-2">M</div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Mentora</h1>
          </div>

          {/* Card */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[28px] p-7 shadow-2xl">

            {/* Step title */}
            <p className="text-[10px] font-black uppercase tracking-[3px] text-cyan-400/70 mb-0.5">Step {step + 1} of 4</p>
            <h2 className="text-[22px] font-black text-white mb-0.5">
              {["Your Details", "Verify Email", "Choose Your Role", "Secure Account"][step]}
            </h2>
            <p className="text-gray-600 text-xs mb-4">
              {[
                "Let's set up your Mentora account",
                `We sent a 6-digit code to ${form.email}`,
                "How will you be using Mentora?",
                "Create a strong password to protect your account",
              ][step]}
            </p>

            <StepBar current={step} total={4} />

            {/* General error — shown on any step */}
            {errors.general && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/30 text-red-300 rounded-2xl px-4 py-3 mb-4 text-xs animate-pulse">
                <FaExclamationCircle className="shrink-0 text-red-400" size={12}/> {errors.general}
              </div>
            )}

            {/* ══ STEP 0: DETAILS ═══════════════════════════════ */}
            {step === 0 && (
              <>
                {/* Full Name */}
                <Field label="Full Name" error={errors.fullName}
                  success={form.fullName.trim().length >= 2 && !errors.fullName}>
                  <FaUser className="text-gray-600 text-xs mr-3 shrink-0" />
                  <input type="text" placeholder="John Doe" value={form.fullName}
                    onChange={setField("fullName")} className={inp} autoFocus />
                </Field>

                {/* Phone */}
                <Field label="Phone Number"
                  error={phoneCheck.taken ? "This number is already registered to another account" : errors.phone}
                  success={isValidPhone(form.phone) && !phoneCheck.taken && !phoneCheck.loading}
                  checking={phoneCheck.loading}>
                  <FaPhone className="text-gray-600 text-xs mr-3 shrink-0" />
                  <input type="tel" placeholder="+91 98765 43210" value={form.phone}
                    onChange={setField("phone")} className={inp} />
                </Field>
                {!errors.phone && !phoneCheck.taken && (
                  <p className="text-gray-700 text-[11px] -mt-3 mb-4 ml-1">Include country code, e.g. +91 for India</p>
                )}

                {/* Email */}
                <Field label="Email Address"
                  error={emailCheck.taken ? "This email is already registered — try logging in instead" : errors.email}
                  success={isValidEmail(form.email) && !emailCheck.taken && !emailCheck.loading}
                  checking={emailCheck.loading}>
                  <FaEnvelope className="text-gray-600 text-xs mr-3 shrink-0" />
                  <input type="email" placeholder="you@example.com" value={form.email}
                    onChange={setField("email")} className={inp} />
                </Field>
                {!errors.email && !emailCheck.taken && (
                  <p className="text-gray-700 text-[11px] -mt-3 mb-4 ml-1">We'll send a verification code to this email</p>
                )}

                {/* Date of Birth */}
                <Field label="Date of Birth" error={errors.dob}
                  success={!!form.dob && getAge(form.dob) >= 18}>
                  <FaCalendar className="text-gray-600 text-xs mr-3 shrink-0" />
                  <input type="date" value={form.dob} onChange={setField("dob")}
                    max={maxDob} className={inp + " [color-scheme:dark]"} />
                </Field>
                {!errors.dob && (
                  <p className="text-gray-700 text-[11px] -mt-3 mb-4 ml-1">Must be 18 years or older to register</p>
                )}

                <button onClick={sendOTP} disabled={loading || phoneCheck.loading || emailCheck.loading}
                  className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 font-black text-sm tracking-wide hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading
                    ? <><div className="w-4 h-4 rounded-full border-2 border-slate-900/20 border-t-slate-900 animate-spin" /> Sending code…</>
                    : <>Continue <FaArrowRight size={11} /></>}
                </button>
              </>
            )}

            {/* ══ STEP 1: VERIFY OTP ════════════════════════════ */}
            {step === 1 && (
              <>
                {devOtp && (
                  <div className="bg-yellow-500/8 border border-yellow-400/25 text-yellow-200/80 rounded-2xl px-4 py-3 mb-1 text-[11px] text-center">
                    <span className="font-bold">Dev mode</span> — email not configured. Code auto-filled:{" "}
                    <span className="font-mono font-black tracking-[4px] text-yellow-300">{devOtp}</span>
                  </div>
                )}

                <OtpBoxes value={otp} onChange={setOtp} />

                {otpErr && (
                  <p className="text-red-400 text-xs text-center mb-3 flex items-center justify-center gap-1">
                    <FaExclamationCircle size={10} /> {otpErr}
                  </p>
                )}

                <button onClick={verifyOTP} disabled={otpLoading || otp.join("").length < 6}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 font-black text-sm hover:scale-[1.01] transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mb-4">
                  {otpLoading
                    ? <><div className="w-4 h-4 rounded-full border-2 border-slate-900/20 border-t-slate-900 animate-spin" /> Verifying…</>
                    : <><FaShieldAlt size={11} /> Verify Email</>}
                </button>

                <div className="flex items-center justify-between">
                  <button onClick={() => setStep(0)}
                    className="text-gray-600 hover:text-gray-300 text-xs flex items-center gap-1 transition-colors">
                    <FaArrowLeft size={9} /> Change email
                  </button>
                  {resendTimer > 0
                    ? <span className="text-gray-600 text-xs">Resend in {resendTimer}s</span>
                    : <button onClick={() => { sendOTP(); setOtp(["","","","","",""]); }}
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-colors">
                        Resend code
                      </button>}
                </div>
              </>
            )}

            {/* ══ STEP 2: ROLE ══════════════════════════════════ */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <RoleCard
                    icon={<FaGraduationCap />} title="Student" tagline="I'm currently studying"
                    perks={["Find mentors & career guidance","Connect with peers","Showcase your projects"]}
                    selected={form.role === "Student"}
                    onClick={() => { setForm(p => ({ ...p, role: "Student" })); setErrors({}); }}
                  />
                  <RoleCard
                    icon={<FaBriefcase />} title="Professional" tagline="I work in industry"
                    perks={["Mentor the next generation","Discover fresh talent","Grow your network"]}
                    selected={form.role === "Professional"}
                    onClick={() => { setForm(p => ({ ...p, role: "Professional" })); setErrors({}); }}
                  />
                </div>

                {errors.role && (
                  <p className="text-red-400 text-xs mb-3 text-center flex items-center justify-center gap-1">
                    <FaExclamationCircle size={10} /> {errors.role}
                  </p>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)}
                    className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                    <FaArrowLeft className="text-white text-xs" />
                  </button>
                  <button onClick={() => { if (validate2()) setStep(3); }}
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 font-black text-sm hover:scale-[1.01] transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                    Continue <FaArrowRight size={11} />
                  </button>
                </div>
              </>
            )}

            {/* ══ STEP 3: PASSWORD ══════════════════════════════ */}
            {step === 3 && (
              <>
                {/* Password */}
                <Field label="Password" error={errors.password}>
                  <FaLock className="text-gray-600 text-xs mr-3 shrink-0" />
                  <input type={showPwd ? "text" : "password"} placeholder="Create a strong password"
                    value={form.password} onChange={setField("password")} className={inp} autoFocus />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="text-gray-600 hover:text-gray-300 ml-2 shrink-0 transition-colors">
                    {showPwd ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </Field>
                <PwdStrength pwd={form.password} />

                {/* Confirm Password */}
                <Field label="Confirm Password" error={errors.confirmPassword}
                  success={!!form.confirmPassword && form.password === form.confirmPassword}>
                  <FaLock className="text-gray-600 text-xs mr-3 shrink-0" />
                  <input type={showConfirm ? "text" : "password"} placeholder="Repeat your password"
                    value={form.confirmPassword} onChange={setField("confirmPassword")} className={inp} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="text-gray-600 hover:text-gray-300 ml-2 shrink-0 transition-colors">
                    {showConfirm ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </Field>

                {/* Summary */}
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-4 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[3px] text-gray-600 mb-2.5">Account Summary</p>
                  {[
                    { l: "Name", v: form.fullName },
                    { l: "Email", v: form.email },
                    { l: "Phone", v: form.phone },
                  ].map(({ l, v }) => (
                    <div key={l} className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs">{l}</span>
                      <span className="text-white text-xs font-medium truncate max-w-[200px]">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-xs">Role</span>
                    <span className="bg-cyan-400/15 text-cyan-300 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                      {form.role}
                    </span>
                  </div>
                </div>

                {/* Terms checkbox */}
                <div
                  onClick={() => { setAgreed(!agreed); setErrors(p => ({ ...p, terms: "" })); }}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer mb-1 border transition-all ${
                    errors.terms
                      ? "border-red-400/50 bg-red-500/5"
                      : agreed
                      ? "border-cyan-400/30 bg-cyan-500/5"
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    agreed ? "bg-cyan-400 border-cyan-400" : errors.terms ? "border-red-400" : "border-gray-600"
                  }`}>
                    {agreed && <FaCheck className="text-slate-900 text-[9px]" />}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    I agree to Mentora's{" "}
                    <span className="text-cyan-400 hover:underline">Terms of Service</span>
                    {" "}and{" "}
                    <span className="text-cyan-400 hover:underline">Privacy Policy</span>
                  </p>
                </div>
                {errors.terms && (
                  <p className="text-red-400 text-[11px] mb-3 ml-1 flex items-center gap-1">
                    <FaExclamationCircle size={9} /> {errors.terms}
                  </p>
                )}

                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep(2)}
                    className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                    <FaArrowLeft className="text-white text-xs" />
                  </button>
                  <button onClick={submit} disabled={loading}
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 font-black text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading
                      ? <><div className="w-4 h-4 rounded-full border-2 border-slate-900/20 border-t-slate-900 animate-spin" /> Creating…</>
                      : <><FaCheck size={11} /> Create Account</>}
                  </button>
                </div>
              </>
            )}

            <p className="text-center mt-5 text-gray-700 text-xs">
              Already have an account?{" "}
              <Link to="/login" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
