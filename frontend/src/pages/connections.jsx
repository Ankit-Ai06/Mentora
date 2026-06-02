import Layout from "../components/Layout";

import { useEffect, useState } from "react";

import axios from "axios";

import { motion } from "framer-motion";

function Connections() {

  const [connections, setConnections] = useState([]);

  const token = localStorage.getItem("token");

  // Fetch Connections
  const fetchConnections = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/users/connections",
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

  useEffect(() => {

    fetchConnections();

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

              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-xl font-black mx-auto">
                {user.fullName?.charAt(0)}
              </div>

              <div className="text-center mt-6">

                <h2 className="text-base font-bold">
                  {user.fullName}
                </h2>

                <p className="text-gray-400 mt-2">
                  {user.email}
                </p>

                <p className="text-cyan-400 mt-1">
                  {user.role}
                </p>

              </div>

            </motion.div>

          ))}

        </div>

      </div>

    </Layout>
  );
}

export default Connections;