import Layout from "../components/Layout";

import { motion } from "framer-motion";

import { useEffect, useState } from "react";

import axios from "axios";
import { API_URL } from "../config";

const HOME_THOUGHTS = [
  {
    title: "One useful connection can change a semester.",
    text: "Ask a clear question, share your context, and follow up with gratitude.",
  },
  {
    title: "Your profile is your learning trail.",
    text: "Post what you are building, what you learned, and where you need feedback.",
  },
  {
    title: "Mentorship starts with curiosity.",
    text: "The best conversations begin with a thoughtful message and a specific goal.",
  },
  {
    title: "Consistency compounds quietly.",
    text: "A small update today becomes visible progress when someone visits tomorrow.",
  },
  {
    title: "Network with generosity first.",
    text: "Recommend a resource, answer a question, or celebrate someone else's progress.",
  },
];

function Home() {

  const user = JSON.parse(localStorage.getItem("user"));
  const firstWelcome = localStorage.getItem("mentora:firstWelcome") === "true";
  const firstName = user?.fullName?.split(" ")[0] || user?.fullName || "there";

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMentors: 0,
    totalPosts: 0,
  });
  const [dailyIndex] = useState(() => Math.floor(Date.now() / 86400000) % HOME_THOUGHTS.length);
  const [activeThought, setActiveThought] = useState(dailyIndex);

  // Fetch Platform Stats
  const fetchStats = async () => {

    try {

      const token = localStorage.getItem("token");

      const [res, connectionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/users/stats/platform`),
        axios.get(`${API_URL}/api/users/connections`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const mentorConnections = Array.isArray(connectionsRes.data)
        ? connectionsRes.data.filter((connection) => connection.mentorshipAvailable).length
        : 0;

      setStats({
        ...res.data,
        totalMentors: mentorConnections,
      });

    } catch (error) {

      console.log(error);
    }
  };

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
    if (firstWelcome) {
      window.setTimeout(() => localStorage.removeItem("mentora:firstWelcome"), 3000);
    }

  }, [firstWelcome]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveThought((prev) => (prev + 1) % HOME_THOUGHTS.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  return (

    <Layout>

      <div className="space-y-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-white/10 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl"
        >

          <h1 className="text-3xl font-black leading-tight">
            {firstWelcome ? "Welcome," : "Welcome back,"}
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {firstWelcome ? firstName : user?.fullName}
            </span>
          </h1>

          <p className="mt-6 text-gray-300 text-sm max-w-2xl">
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
            className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-2xl p-4"
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
              Mentor Connections
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {HOME_THOUGHTS.slice(0, 3).map((_, index) => {
            const thoughtIndex = (dailyIndex + index) % HOME_THOUGHTS.length;
            const item = HOME_THOUGHTS[thoughtIndex];
            const active = thoughtIndex === activeThought;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className={`rounded-2xl border p-7 min-h-56 flex flex-col justify-between overflow-hidden relative ${
                  active
                    ? "bg-cyan-400/15 border-cyan-400/30 shadow-xl shadow-cyan-500/10"
                    : "bg-white/10 border-white/10"
                }`}
              >
                <div className="absolute right-5 top-5 text-5xl font-black text-cyan-400/10">
                  0{index + 1}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[2px] text-cyan-400 mb-3">
                    Mentora daily thought
                  </p>
                  <h3 className="text-2xl font-black text-white leading-tight pr-8">{item.title}</h3>
                  <p className="text-gray-400 text-sm mt-4 leading-relaxed">{item.text}</p>
                </div>
                <div className="mt-5 flex gap-1.5">
                  {HOME_THOUGHTS.map((dot, dotIndex) => (
                    <span
                      key={dot.title}
                      className={`h-1.5 rounded-full ${
                        dotIndex === activeThought ? "w-6 bg-cyan-400" : "w-1.5 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <footer className="border-t border-white/10 pt-5 text-center text-sm text-gray-500">
          Message from Mentora: build real skills, keep your network warm, and let every small update tell your story.
        </footer>

      </div>

    </Layout>
  );
}

export default Home;
