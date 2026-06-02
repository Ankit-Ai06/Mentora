import Layout from "../components/Layout";

import { useEffect, useState } from "react";

import axios from "axios";

import { motion } from "framer-motion";
import { API_URL } from "../config";

function People() {

  const [search, setSearch] = useState("");

  const [users, setUsers] = useState([]);

  const [roleFilter, setRoleFilter] =
  useState("all");

  const token = localStorage.getItem("token");

  <select
  value={roleFilter}
  onChange={(e)=>
    setRoleFilter(e.target.value)
  }
>
  <option value="all">
    All
  </option>

  <option value="student">
    Students
  </option>

  <option value="professional">
    Professionals
  </option>

  <option value="mentor">
    Mentors
  </option>

  <option value="recruiter">
    Recruiters
  </option>
</select>


  // Fetch Users
  const fetchUsers = async () => {

    try {

      const res = await axios.get(
       `${API_URL}/api/users`
      );

      setUsers(res.data);

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

      alert(res.data.message);

    } catch (error) {

      alert("Request failed");
    }
  };

  useEffect(() => {

    fetchUsers();

  }, []);

  const filteredUsers = users.filter((user) =>
    user.fullName
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (

    <Layout>

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">

          <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Connect People
          </h1>

          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/10 border border-white/10 rounded-2xl px-5 py-2 outline-none text-white w-80"
          />

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

              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-xl font-black mx-auto">
                {user.fullName?.charAt(0)}
              </div>

              {/* Info */}
              <div className="text-center mt-6">

                <h2 className="text-base font-bold">
                  {user.fullName}
                </h2>
                <p className="text-cyan-400 font-medium">
                  {user.role}
                </p>

                <p className="text-gray-400 mt-2">
                  {user.email}
                </p>

              </div>

              {/* Button */}
              <button
                onClick={() => connectUser(user._id)}
                className="mt-6 w-full bg-gradient-to-r from-cyan-400 to-blue-500 py-2 rounded-2xl font-bold hover:scale-105 transition-all duration-300"
              >
                Connect
              </button>

            </motion.div>

          ))}

        </div>

      </div>

    </Layout>
  );
}

export default People;