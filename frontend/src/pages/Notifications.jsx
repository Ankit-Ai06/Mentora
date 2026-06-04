import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaBell, FaCheck, FaTimes, FaCommentDots } from "react-icons/fa";
import { API_URL } from "../config";

const profileImageSrc = (src) =>
  src?.startsWith("http") ? src : `${API_URL}/uploads/${src}`;

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loadingId, setLoadingId] = useState("");
  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const refreshBadges = () =>
    window.dispatchEvent(new Event("mentora:refresh-badges"));

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, { headers });
      const items = Array.isArray(res.data) ? res.data : [];
      setNotifications(items.map((item) => ({ ...item, read: true })));
      if (items.some((item) => !item.read)) {
        await axios.put(`${API_URL}/api/notifications/read-all`, {}, { headers });
        refreshBadges();
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRequest = async (notification, action) => {
    if (!notification.sender?._id) return;
    setLoadingId(notification._id);

    try {
      await axios.post(
        `${API_URL}/api/users/${action}/${notification.sender._id}`,
        {},
        { headers }
      );
      if (action === "ignore") {
        setNotifications((prev) => prev.filter((n) => n._id !== notification._id));
      } else {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id
              ? { ...n, read: true, requestPending: false, actionStatus: "accepted" }
              : n
          )
        );
      }
      refreshBadges();
    } catch (err) {
      console.log(err);
    }

    setLoadingId("");
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-5">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Connection requests, messages and profile updates
            </p>
          </div>

        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <FaBell className="mx-auto text-5xl opacity-20 mb-4" />
              <p className="font-semibold">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`relative bg-white/5 border rounded-2xl p-4 flex gap-3 transition-all ${
                  n.read
                    ? "border-white/10"
                    : "border-cyan-400/30 bg-cyan-400/10"
                }`}
              >
                {!n.read && (
                  <span className="absolute right-4 top-4 w-2.5 h-2.5 rounded-full bg-red-500" />
                )}

                <Link to={n.sender?._id ? `/profile/${n.sender._id}` : "/notifications"} className="w-11 h-11 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center font-black text-slate-950 shrink-0 overflow-hidden">
                  {n.sender?.profileImage || n.sender?.profilePicture ? (
                    <img
                      src={profileImageSrc(n.sender.profileImage || n.sender.profilePicture)}
                      alt={n.sender?.fullName || "Mentora"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    n.sender?.fullName?.charAt(0) || "M"
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <p className="text-white pr-6">
                    {n.sender?._id ? (
                      <Link to={`/profile/${n.sender._id}`} className="font-bold hover:text-cyan-300">
                        {n.sender?.fullName || "Mentora"}
                      </Link>
                    ) : (
                      <span className="font-bold">{n.sender?.fullName || "Mentora"}</span>
                    )}{" "}
                    <span className="text-gray-300">{n.text}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>

                  {n.type === "connection_request" && n.requestPending && (
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        disabled={loadingId === n._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequest(n, "accept");
                        }}
                        className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-2 disabled:opacity-60"
                      >
                        <FaCheck size={10} /> Confirm
                      </button>
                      <button
                        type="button"
                        disabled={loadingId === n._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequest(n, "ignore");
                        }}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60"
                      >
                        <FaTimes size={10} /> Ignore
                      </button>
                    </div>
                  )}

                  {n.type === "connection_request" && n.actionStatus === "accepted" && n.sender?._id && (
                    <Link
                      to="/chat"
                      state={{ userId: n.sender._id }}
                      className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black"
                    >
                      <FaCommentDots size={11} /> Message
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Notifications;
