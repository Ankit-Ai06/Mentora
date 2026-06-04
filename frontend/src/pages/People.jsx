import Layout from "../components/Layout";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import axios from "axios";

import { motion } from "framer-motion";
import { API_URL } from "../config";
import { mediaUrl } from "../utils/media";
const profileImageSrc = mediaUrl;

function People() {

  const [search, setSearch] = useState("");

  const [users, setUsers] = useState([]);

  const [roleFilter, setRoleFilter] =
  useState("all");

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Fetch Users
  const fetchUsers = async () => {

    try {

      const res = await axios.get(
       `${API_URL}/api/users`
      );

      setUsers(res.data.filter((u) => u._id !== currentUser._id));

    } catch (error) {

      console.log(error);
    }
  };

  // Send Request
  const connectUser = async (id) => {

    try {

      const res = await axios.post(
        `${API_URL}/api/users/connect/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers((prev) =>
        prev.map((user) =>
          user._id === id
            ? res.data.status === "connected"
              ? {
                  ...user,
                  requestSent: false,
                  connections: [...(user.connections || []), currentUser._id],
                }
              : { ...user, requestSent: true }
            : user
        )
      );

    } catch (error) {

      console.log(error);
      alert("Request failed");
    }
  };

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.fullName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      user.role?.toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  return (

    <Layout>

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-10">

          <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Connect People
          </h1>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="mentora-select bg-white/10 border border-white/10 rounded-2xl px-5 py-2 outline-none text-white"
            >
              <option value="all">All</option>
              <option value="Student">Students</option>
              <option value="Professional">Professionals</option>
            </select>
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-2xl px-5 py-2 outline-none text-white w-full sm:w-80"
            />
          </div>

        </div>

        {/* Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {filteredUsers.map((user) => (

            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 border border-white/10 backdrop-blur-2xl rounded-2xl p-6 shadow-xl"
            >

              <Link to={`/profile/${user._id}`} className="block">
                {user.profileImage || user.profilePicture ? (
                  <img
                    src={profileImageSrc(user.profileImage || user.profilePicture)}
                    alt={user.fullName}
                    className="w-16 h-16 rounded-full object-cover mx-auto"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-xl font-black mx-auto">
                    {user.fullName?.charAt(0)}
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="text-center mt-6">

                <Link to={`/profile/${user._id}`} className="text-base font-bold hover:text-cyan-300">
                  {user.fullName}
                </Link>
                <p className="text-cyan-400 font-medium">
                  {user.role}
                </p>

                {user.mentorshipAvailable && (
                  <p className="mt-2 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">
                    Mentorship available
                  </p>
                )}

                <p className="text-gray-400 mt-2">
                  {user.isPrivate ? "Private account" : user.email}
                </p>

              </div>

              {/* Button */}
              <button
                disabled={user.requestSent || user.connections?.includes(currentUser._id)}
                onClick={() => connectUser(user._id)}
                className="mt-6 w-full bg-gradient-to-r from-cyan-400 to-blue-500 py-2 rounded-2xl font-bold hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100"
              >
                {user.connections?.includes(currentUser._id)
                  ? "Connected"
                  : user.requestSent
                  ? "Request sent"
                  : "Connect"}
              </button>

            </motion.div>

          ))}

        </div>

      </div>

    </Layout>
  );
}

export default People;
