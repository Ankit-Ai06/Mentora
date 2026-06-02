import Layout from "../components/Layout";

import { motion } from "framer-motion";

import { useEffect, useState } from "react";

import axios from "axios";

function Home() {

  const user = JSON.parse(localStorage.getItem("user"));

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMentors: 0,
    totalPosts: 0,
  });

  // Fetch Platform Stats
  const fetchStats = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/users/stats/platform"
      );

      setStats(res.data);

    } catch (error) {

      console.log(error);
    }
  };

  useEffect(() => {

    fetchStats();

  }, []);

  return (

    <Layout>

      <div className="space-y-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-white/10 backdrop-blur-2xl rounded-[30px] p-10 shadow-2xl"
        >

          <h1 className="text-5xl font-black leading-tight">
            Welcome back,
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {user?.fullName}
            </span>
          </h1>

          <p className="mt-6 text-gray-300 text-lg max-w-2xl">
            Build connections with students, mentors,
            recruiters, and professionals worldwide.
          </p>

          <div className="mt-8 flex gap-4">

            <button
              onClick={() => window.location.href="/feed"}
              className="bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 rounded-2xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Explore Feed
            </button>

            <button
              onClick={() => window.location.href="/people"}
              className="border border-white/20 px-6 py-3 rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300"
            >
              Connect People
            </button>

          </div>

        </motion.div>

        {/* Real-Time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6"
          >

            <h2 className="text-5xl font-black text-cyan-400">
              {stats.totalUsers}
            </h2>

            <p className="text-gray-300 mt-2">
              Active Users
            </p>

          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6"
          >

            <h2 className="text-5xl font-black text-cyan-400">
              {stats.totalMentors}
            </h2>

            <p className="text-gray-300 mt-2">
              Mentors Connected
            </p>

          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6"
          >

            <h2 className="text-5xl font-black text-cyan-400">
              {stats.totalPosts}
            </h2>

            <p className="text-gray-300 mt-2">
              Projects Shared
            </p>

          </motion.div>

        </div>

      </div>

    </Layout>
  );
}

export default Home;