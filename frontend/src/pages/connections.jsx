import Layout from "../components/Layout";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import axios from "axios";

import { motion } from "framer-motion";
import { API_URL } from "../config";
const profileImageSrc = (src) =>
  src?.startsWith("http") ? src : `${API_URL}/uploads/${src}`;

function Connections() {

  const [connections, setConnections] = useState([]);
  const [busyId, setBusyId] = useState("");

  const token = localStorage.getItem("token");

  // Fetch Connections
  const fetchConnections = async () => {

    try {

      const res = await axios.get(
        `${API_URL}/api/users/connections`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setConnections(res.data);

    } catch (error) {

      console.log(error);
    }
  };

  const disconnect = async (id) => {
    setBusyId(id);
    try {
      await axios.post(
        `${API_URL}/api/users/disconnect/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setConnections((prev) => prev.filter((user) => user._id !== id));
    } catch (error) {
      console.log(error);
    }
    setBusyId("");
  };

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConnections();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (

    <Layout>

      <div className="max-w-6xl mx-auto">

        <h1 className="text-5xl font-black mb-10 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Your Connections
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {connections.map((user) => (

            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 border border-white/10 backdrop-blur-2xl rounded-2xl p-6 shadow-xl"
            >

              <Link to={`/profile/${user._id}`} className="relative block w-16 h-16 mx-auto">
                {user.profileImage || user.profilePicture ? (
                  <img
                    src={profileImageSrc(user.profileImage || user.profilePicture)}
                    alt={user.fullName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-xl font-black">
                    {user.fullName?.charAt(0)}
                  </div>
                )}
                {user.preferences?.showOnlineStatus !== false && (
                  <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 ${
                    user.isOnline ? "bg-green-400" : "bg-gray-500"
                  }`} />
                )}
              </Link>

              <div className="text-center mt-6">

                <Link to={`/profile/${user._id}`} className="text-base font-bold hover:text-cyan-300">
                  {user.fullName}
                </Link>

                <p className="text-gray-400 mt-2">
                  {user.email}
                </p>

                <p className="text-cyan-400 mt-1">
                  {user.preferences?.showOnlineStatus !== false && user.isOnline ? "Online" : user.role}
                </p>

              </div>

              <button
                type="button"
                disabled={busyId === user._id}
                onClick={() => disconnect(user._id)}
                className="mt-5 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
              >
                {busyId === user._id ? "Removing..." : "Connected"}
              </button>

            </motion.div>

          ))}

        </div>

      </div>

    </Layout>
  );
}

export default Connections;
