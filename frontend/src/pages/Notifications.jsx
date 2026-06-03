import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaBell, FaCheck, FaTimes } from "react-icons/fa";
import { API_URL } from "../config";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loadingId, setLoadingId] = useState("");
  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, { headers });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (id) => {
    try {
      await axios.put(`${API_URL}/api/notifications/read/${id}`, {}, { headers });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleRequest = async (notification, action) => {
    if (!notification.sender?._id) return;
    setLoadingId(notification._id);

    try {
      await axios.post(
        `${API_URL}/api/users/${action}/${notification.sender._id}`,
        {},
        { headers }
      );
      await markRead(notification._id);
      await fetchNotifications();
    } catch (err) {
      console.log(err);
    }

    setLoadingId("");
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, { headers });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.log(err);
    }
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

          {notifications.some((n) => !n.read) && (
            <button
              type="button"
              onClick={markAllRead}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-sm font-bold text-white"
            >
              Mark all read
            </button>
          )}
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
                onClick={() => !n.read && markRead(n._id)}
                className={`relative bg-white/5 border rounded-2xl p-4 flex gap-3 transition-all ${
                  n.read
                    ? "border-white/10"
                    : "border-cyan-400/30 bg-cyan-400/10"
                }`}
              >
                {!n.read && (
                  <span className="absolute right-4 top-4 w-2.5 h-2.5 rounded-full bg-red-500" />
                )}

                <div className="w-11 h-11 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center font-black text-slate-950 shrink-0">
                  {n.sender?.fullName?.charAt(0) || "M"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white pr-6">
                    <span className="font-bold">{n.sender?.fullName || "Mentora"}</span>{" "}
                    <span className="text-gray-300">{n.text}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>

                  {n.type === "connection_request" && !n.read && (
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
