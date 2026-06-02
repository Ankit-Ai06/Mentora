import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
function Notifications() {

  const [notifications,
  setNotifications] =
  useState([]);

  const token =
  localStorage.getItem("token");

  const fetchNotifications =
  async () => {

    try {

      const res =
      await axios.get(
      `${API_URL}/api/notifications`,
      {
        headers:{
          Authorization:
          `Bearer ${token}`
        }
      });

      setNotifications(
      res.data
      );

    } catch(err){

      console.log(err);

    }

  };

  useEffect(()=>{

    fetchNotifications();

  },[]);

  return(

    <Layout>

      <div className="max-w-2xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Notifications
        </h1>

        <div className="space-y-3">

          {
          notifications.map((n)=>(

            <div
              key={n._id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3"
            >

              <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">

                {
                n.sender?.fullName?.charAt(0)
                }

              </div>

              <div>

                <p>

                  <span className="font-semibold">

                    {n.sender?.fullName}

                  </span>

                  {" "}

                  {n.text}

                </p>

                <p className="text-xs text-gray-400">

                  {
                  new Date(
                    n.createdAt
                  ).toLocaleString()
                  }

                </p>

              </div>

            </div>

          ))
          }

        </div>

      </div>

    </Layout>

  );
}

export default Notifications;