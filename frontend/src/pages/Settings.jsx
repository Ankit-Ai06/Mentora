import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import {
  FaLock, FaBell, FaShieldAlt, FaEye, FaUserSlash,
  FaLanguage, FaQuestionCircle, FaInfoCircle,
  FaSignOutAlt, FaTrash, FaChevronRight, FaCheck,
  FaEyeSlash, FaMoon, FaSun, FaDownload, FaLink,
  FaExclamationTriangle, FaUser,
} from "react-icons/fa";
import { motion } from "framer-motion";

import { API_URL } from "../config";

const API = API_URL;

// ─── TOGGLE ───────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(!value); }}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 ${
        value ? "bg-cyan-400" : "bg-white/20"
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
          value ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}

// ─── SECTION ──────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1 mb-2">
        {title}
      </h3>
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

// ─── ROW (click row) — no toggle ──────────────────────────────────
function ClickRow({ icon, label, sublabel, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 transition-colors text-left ${
        danger ? "hover:bg-red-500/10" : "hover:bg-white/5"
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        danger ? "bg-red-500/20 text-red-400" : "bg-white/10 text-cyan-400"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${danger ? "text-red-400" : "text-white"}`}>{label}</p>
        {sublabel && <p className="text-xs text-gray-500 truncate">{sublabel}</p>}
      </div>
      <FaChevronRight className="text-gray-600 text-xs shrink-0" />
    </button>
  );
}

// ─── ROW (toggle) — div wrapper to avoid nested button ────────────
function ToggleRow({ icon, label, sublabel, value, onChange }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors cursor-default">
      <div className="w-9 h-9 rounded-xl bg-white/10 text-cyan-400 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 truncate">{sublabel}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

// ─── CHANGE PASSWORD MODAL ────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!form.current || !form.newPass || !form.confirm)
      return setError("All fields are required");
    if (form.newPass.length < 6)
      return setError("New password must be at least 6 characters");
    if (form.newPass !== form.confirm)
      return setError("Passwords do not match");

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/api/auth/change-password`,
        { currentPassword: form.current, newPassword: form.newPass },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Password changed successfully!");
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    }
    setLoading(false);
  };

  const fields = [
    { key: "current", placeholder: "Current password" },
    { key: "newPass", placeholder: "New password" },
    { key: "confirm", placeholder: "Confirm new password" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
      <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-black text-white mb-6">Change Password</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-400/30 text-red-300 rounded-2xl px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-400/30 text-green-300 rounded-2xl px-4 py-3 mb-4 text-sm flex items-center gap-2">
            <FaCheck /> {success}
          </div>
        )}

        {fields.map(({ key, placeholder }) => (
          <div key={key} className="relative mb-4">
            <input
              type={show[key] ? "text" : "password"}
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-white/10 border border-white/10 rounded-2xl pl-4 pr-12 py-3.5 text-white placeholder-gray-400 outline-none focus:border-cyan-400/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShow({ ...show, [key]: !show[key] })}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {show[key] ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        ))}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold transition-all hover:scale-[1.02] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
      <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 w-full max-w-sm shadow-2xl text-center">
        <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${
          danger ? "bg-red-500/20" : "bg-cyan-400/20"
        }`}>
          <FaExclamationTriangle className={danger ? "text-red-400 text-xl" : "text-cyan-400 text-xl"} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
        <p className="text-gray-400 text-sm mb-8">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all hover:scale-[1.02] text-white ${
              danger
                ? "bg-gradient-to-r from-red-500 to-pink-500"
                : "bg-gradient-to-r from-cyan-400 to-blue-500"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN SETTINGS ────────────────────────────────────────────────
function Settings() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const [prefs, setPrefs] = useState({
    pushNotifications: true,
    emailNotifications: true,
    messageNotifications: true,
    connectionNotifications: true,
    privateAccount: false,
    showOnlineStatus: true,
    showLastSeen: true,
    readReceipts: true,
    darkMode: true,
    twoFactor: false,
  });

  const setPref = (key) => (val) => setPrefs((p) => ({ ...p, [key]: val }));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    localStorage.clear();
    navigate("/login");
  };

  return (
    <Layout>
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
      {confirmModal && (
        <ConfirmModal {...confirmModal} onClose={() => setConfirmModal(null)} />
      )}

      <div className="max-w-2xl mx-auto py-6 px-2">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile card */}
        <div
          onClick={() => navigate("/profile")}
          className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-3xl px-5 py-4 mb-6 cursor-pointer hover:bg-white/10 transition-colors"
        >
          {user.profileImage || user.profilePicture ? (
            <img
              src={`${API}/uploads/${user.profileImage || user.profilePicture}`}
              alt={user.fullName}
              className="w-14 h-14 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-xl font-black text-white shrink-0">
              {user?.fullName?.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-lg truncate">{user?.fullName}</p>
            <p className="text-gray-400 text-sm truncate">{user?.email}</p>
          </div>
          <span className="text-cyan-400 text-sm font-medium shrink-0">Edit profile →</span>
        </div>

        {/* ── ACCOUNT ── */}
        <Section title="Account">
          <ClickRow
            icon={<FaLock />}
            label="Change Password"
            sublabel="Update your login password"
            onClick={() => setShowChangePassword(true)}
          />
          <ToggleRow
            icon={<FaShieldAlt />}
            label="Two-Factor Authentication"
            sublabel={prefs.twoFactor ? "Enabled — extra security active" : "Add extra security to your account"}
            value={prefs.twoFactor}
            onChange={setPref("twoFactor")}
          />
          <ClickRow
            icon={<FaLink />}
            label="Linked Accounts"
            sublabel="Google, LinkedIn, GitHub"
            onClick={() => {}}
          />
          <ClickRow
            icon={<FaDownload />}
            label="Download Your Data"
            sublabel="Get a copy of your Mentora data"
            onClick={() =>
              setConfirmModal({
                title: "Download Data",
                message: "We'll prepare your data and email a download link within 24 hours.",
                confirmLabel: "Request",
                danger: false,
                onConfirm: () => setConfirmModal(null),
              })
            }
          />
        </Section>

        {/* ── PRIVACY ── */}
        <Section title="Privacy">
          <ToggleRow
            icon={<FaEye />}
            label="Private Account"
            sublabel="Only approved followers can see your posts"
            value={prefs.privateAccount}
            onChange={setPref("privateAccount")}
          />
          <ToggleRow
            icon={<FaEye />}
            label="Show Online Status"
            sublabel="Let others see when you're active"
            value={prefs.showOnlineStatus}
            onChange={setPref("showOnlineStatus")}
          />
          <ToggleRow
            icon={<FaEye />}
            label="Show Last Seen"
            sublabel="Let others see your last active time"
            value={prefs.showLastSeen}
            onChange={setPref("showLastSeen")}
          />
          <ToggleRow
            icon={<FaCheck />}
            label="Read Receipts"
            sublabel="Show when you've seen messages"
            value={prefs.readReceipts}
            onChange={setPref("readReceipts")}
          />
          <ClickRow
            icon={<FaUserSlash />}
            label="Blocked Accounts"
            sublabel="Manage people you've blocked"
            onClick={() => {}}
          />
        </Section>

        {/* ── NOTIFICATIONS ── */}
        <Section title="Notifications">
          <ToggleRow
            icon={<FaBell />}
            label="Push Notifications"
            sublabel="In-app alerts"
            value={prefs.pushNotifications}
            onChange={setPref("pushNotifications")}
          />
          <ToggleRow
            icon={<FaBell />}
            label="Email Notifications"
            sublabel="Updates sent to your email"
            value={prefs.emailNotifications}
            onChange={setPref("emailNotifications")}
          />
          <ToggleRow
            icon={<FaBell />}
            label="Message Notifications"
            sublabel="New messages and requests"
            value={prefs.messageNotifications}
            onChange={setPref("messageNotifications")}
          />
          <ToggleRow
            icon={<FaBell />}
            label="Connection Notifications"
            sublabel="New connection requests"
            value={prefs.connectionNotifications}
            onChange={setPref("connectionNotifications")}
          />
        </Section>

        {/* ── APPEARANCE ── */}
        <Section title="Appearance">
          <ToggleRow
            icon={prefs.darkMode ? <FaMoon /> : <FaSun />}
            label="Dark Mode"
            sublabel={prefs.darkMode ? "Currently dark" : "Currently light"}
            value={prefs.darkMode}
            onChange={setPref("darkMode")}
          />
          <ClickRow
            icon={<FaLanguage />}
            label="Language"
            sublabel="English (US)"
            onClick={() => {}}
          />
        </Section>

        {/* ── SUPPORT ── */}
        <Section title="Support">
          <ClickRow icon={<FaQuestionCircle />} label="Help Center" sublabel="FAQs and troubleshooting" onClick={() => {}} />
          <ClickRow icon={<FaInfoCircle />} label="About Mentora" sublabel="Version 1.0.0" onClick={() => {}} />
          <ClickRow icon={<FaShieldAlt />} label="Privacy Policy" onClick={() => {}} />
        </Section>

        {/* ── DANGER ZONE ── */}
        <Section title="Account Actions">
          <ClickRow
            icon={<FaSignOutAlt />}
            label="Log Out"
            sublabel="Sign out of your account"
            danger
            onClick={() =>
              setConfirmModal({
                title: "Log Out?",
                message: "Are you sure you want to log out from Mentora?",
                confirmLabel: "Log Out",
                danger: true,
                onConfirm: handleLogout,
              })
            }
          />
          <ClickRow
            icon={<FaTrash />}
            label="Delete Account"
            sublabel="Permanently remove your account and all data"
            danger
            onClick={() =>
              setConfirmModal({
                title: "Delete Account?",
                message:
                  "This action is permanent and cannot be undone. All your posts, messages and data will be deleted forever.",
                confirmLabel: "Delete Forever",
                danger: true,
                onConfirm: handleDeleteAccount,
              })
            }
          />
        </Section>

      </div>
    </Layout>
  );
}

export default Settings;
