import {
  FaHome,
  FaComments,
  FaUser,
  FaBell,
  FaSignOutAlt,
  FaCog,
  FaUsers,
  FaMoon,
  FaSun,
} from "react-icons/fa";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { API_URL } from "../config";
const profileImageSrc = (src) =>
  src?.startsWith("http") ? src : `${API_URL}/uploads/${src}`;
function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);
  const [badges, setBadges] = useState({ notifications: 0, messages: 0 });
  const [themePrefs, setThemePrefs] = useState(() =>
    JSON.parse(localStorage.getItem("preferences") || "{}")
  );

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const darkMode = themePrefs.darkMode === true;

  useEffect(() => {
    const fetchBadges = async () => {
      const token = localStorage.getItem("token");
      if (!token || !user?._id) return;

      try {
        const [nRes, mRes] = await Promise.all([
          fetch(`${API_URL}/api/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/messages/unread/${user._id}`),
        ]);
        const nData = await nRes.json();
        const mData = await mRes.json();
        setBadges({
          notifications: nData.count || 0,
          messages: mData.count || 0,
        });
      } catch (err) {
        console.log(err);
      }
    };

    fetchBadges();
    const id = setInterval(fetchBadges, 30000);
    window.addEventListener("mentora:refresh-badges", fetchBadges);
    return () => {
      clearInterval(id);
      window.removeEventListener("mentora:refresh-badges", fetchBadges);
    };
  }, [location.pathname, user?._id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleTheme = () => {
    const nextPrefs = { ...themePrefs, darkMode: !darkMode };
    const nextUser = {
      ...user,
      preferences: { ...(user.preferences || {}), darkMode: !darkMode },
    };
    localStorage.setItem("preferences", JSON.stringify(nextPrefs));
    localStorage.setItem("user", JSON.stringify(nextUser));
    setThemePrefs(nextPrefs);
  };

  const navItems = [
    { to: "/home", icon: <FaHome />, label: "Home" },
    { to: "/chat", icon: <FaComments />, label: "Messages", badge: badges.messages },
    { to: "/profile", icon: <FaUser />, label: "Profile" },
    { to: "/notifications", icon: <FaBell />, label: "Notifications", badge: badges.notifications },
    { to: "/connections", icon: <FaUsers />, label: "Connections" },
    { to: "/settings", icon: <FaCog />, label: "Settings" },
  ];

  return (
    <div className={`mentora-app ${darkMode ? "mentora-dark bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white" : "mentora-light bg-slate-100 text-slate-950"} min-h-screen flex overflow-hidden`}>
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20"
        title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
      >
        {darkMode ? <FaSun /> : <FaMoon />}
      </button>

      {/* ── SIDEBAR ── */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-20 md:w-60 bg-white/5 border-r border-white/10 backdrop-blur-2xl flex flex-col justify-between py-6 px-4 shrink-0"
      >
        {/* Top */}
        <div>
          {/* Logo */}
          <div className="mb-10 flex justify-center md:block">
            <h1 className="hidden md:block text-lg font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Mentora
            </h1>
            <div className="md:hidden w-10 h-10 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-lg font-black">
              M
            </div>
            <p className="hidden md:block text-gray-400 mt-1 text-xs">
              Connect. Collaborate. Grow.
            </p>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map(({ to, icon, label, badge }) => {
              const active = location.pathname.toLowerCase() === to.toLowerCase();
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center justify-center md:justify-start gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
                    active
                      ? "bg-cyan-500/20 border border-cyan-400/20 text-cyan-400"
                      : darkMode ? "hover:bg-white/10 text-gray-300 hover:text-white" : "hover:bg-slate-200 text-slate-600 hover:text-slate-950"
                  }`}
                >
                  <span className="relative text-lg">
                    {icon}
                    {badge > 0 && (
                      <span className="absolute -right-2 -top-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="hidden md:block font-medium text-sm">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center md:items-stretch gap-3">

          {/* User Card */}
          <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 rounded-3xl px-4 py-3">
            {user.profileImage || user.profilePicture ? (
              <img
                src={profileImageSrc(user.profileImage || user.profilePicture)}
                alt={user.fullName}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-sm shrink-0">
                {user?.fullName?.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{user?.fullName}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => setShowLogout(true)}
            className="w-10 h-10 md:w-full rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center gap-3 hover:scale-105 transition-all duration-300"
          >
            <FaSignOutAlt className="text-base" />
            <span className="hidden md:block font-semibold text-sm">Logout</span>
          </button>

        </div>
      </motion.div>

      {/* ── MAIN ── */}
      <div className="flex-1 overflow-y-auto p-5 min-w-0">
        {children}
      </div>

      {/* ── LOGOUT MODAL ── */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 rounded-[30px] p-8 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-3xl font-black mb-2">Logout?</h2>
            <p className="text-gray-400 mb-8">Are you sure you want to logout from Mentora?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 transition-all px-4 py-3 rounded-2xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 px-4 py-3 rounded-2xl font-bold hover:scale-105 transition-all"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

export default Layout;
