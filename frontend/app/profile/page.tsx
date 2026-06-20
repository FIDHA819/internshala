"use client";

import {
  ExternalLink,
  Mail,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import Link from "next/link";
import { toast } from "react-toastify";
import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser } from "../../Feature/userSlice";

export default function Profilepage() {
  const user = useSelector(selectuser);

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  
  // Login History & Pagination States
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // Change this number to show more or fewer logs per page

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/profile-dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProfileData(res.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/friend-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFriends(res.data.friends || []);
      setRequests(res.data.requests || []);

      const historyRes = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLoginHistory(historyRes.data.history || []);
    } catch (err) {
      console.error("Error fetching friends/history:", err);
    }
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/application/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setApplications(res.data.applications || []);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchApplications();
      fetchFriends();
      fetchProfile();
    }
  }, [user]);

  const acceptRequest = async (senderId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/friend-request/accept/${senderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(res.data.message);
      fetchFriends();
    } catch (err) {
      console.error("Error accepting friend request:", err);
    }
  };

  // Applications Statistics
  const total = applications.length;
  const accepted = applications.filter((app) => app.status === "accepted").length;
  const pending = applications.filter((app) => app.status === "pending").length;
  const rejected = applications.filter((app) => app.status === "rejected").length;

  // Pagination Logic for Login History
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHistoryItems = loginHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(loginHistory.length / itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          
          {/* Header */}
          <div className="relative h-40 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="absolute left-1/2 -bottom-14 transform -translate-x-1/2">
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt="profile"
                  className="w-28 h-28 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center border-4 border-gray-200">
                  <User size={50} className="text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-20 pb-8 px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold">{user?.name || "Guest User"}</h1>
              <div className="flex justify-center items-center mt-3 text-gray-500">
                <Mail className="mr-2" size={18} />
                {user?.email}
              </div>

              {profileData?.user && (
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold">Current Plan</h3>
                    <p className="capitalize text-blue-700 font-bold">
                      {profileData.user.plan}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold">Applications Used</h3>
                    <p className="text-green-700 font-bold">
                      {profileData.user.monthlyApplicationCount}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold">Plan Expiry</h3>
                    <p className="text-yellow-700 font-bold">
                      {profileData.user.planExpiresAt
                        ? new Date(profileData.user.planExpiresAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              <div className="bg-blue-50 p-5 rounded">
                <div className="text-3xl font-bold text-blue-700">{total}</div>
                <p className="text-gray-600 text-sm mt-1">Applications</p>
              </div>

              <div className="bg-green-50 p-5 rounded">
                <div className="text-3xl font-bold text-green-700">{accepted}</div>
                <p className="text-gray-600 text-sm mt-1">Accepted</p>
              </div>

              <div className="bg-yellow-50 p-5 rounded">
                <div className="text-3xl font-bold text-yellow-700">{pending}</div>
                <p className="text-gray-600 text-sm mt-1">Pending</p>
              </div>

              <div className="bg-red-50 p-5 rounded">
                <div className="text-3xl font-bold text-red-700">{rejected}</div>
                <p className="text-gray-600 text-sm mt-1">Rejected</p>
              </div>
            </div>

            {/* Friend Requests Section */}
            <div className="mt-10">
              <h2 className="text-xl font-bold mb-4">Friend Requests</h2>
              {requests.length === 0 ? (
                <p className="text-gray-500">No pending requests</p>
              ) : (
                requests.map((request: any) => (
                  <div
                    key={request._id}
                    className="flex justify-between items-center border p-3 rounded mb-2 bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={request.photo || "/default-avatar.png"}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="text-gray-700 font-medium">{request.email}</span>
                    </div>
                    <button
                      onClick={() => acceptRequest(request._id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Friends Section */}
            <div className="mt-10">
              <h2 className="text-xl font-bold mb-4">Friends</h2>
              {friends.length === 0 ? (
                <p className="text-gray-500">No friends yet</p>
              ) : (
                friends.map((friend: any) => (
                  <div key={friend._id} className="border p-3 rounded mb-2 bg-white text-gray-700 shadow-sm">
                    {friend.email}
                  </div>
                ))
              )}
            </div>

            {/* Login History Section with Pagination */}
            <div className="mt-10">
              <h2 className="text-xl font-bold mb-4">Login History</h2>
              {loginHistory.length === 0 ? (
                <p className="text-gray-500">No history details found</p>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {currentHistoryItems.map((item: any) => (
                      <div key={item._id} className="border p-4 rounded bg-white shadow-sm text-sm text-gray-600">
                        <p><span className="font-semibold text-gray-800">Browser:</span> {item.browser}</p>
                        <p><span className="font-semibold text-gray-800">OS:</span> {item.os}</p>
                        <p><span className="font-semibold text-gray-800">Device:</span> {item.deviceType}</p>
                        <p><span className="font-semibold text-gray-800">IP:</span> {item.ipAddress}</p>
                        <p className="mt-1">
                          <span className="font-semibold text-gray-800">Status:</span>{" "}
                          <span className={item.status === "success" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {item.status}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                      <span className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                          className="p-2 border rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:hover:bg-white text-gray-600"
                          aria-label="Previous page"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="p-2 border rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:hover:bg-white text-gray-600"
                          aria-label="Next page"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
{profileData?.user?.resumeId && (
  <div className="mt-8 text-center">
    <Link
      href="/resume-builder"
      className="bg-green-600 text-white px-5 py-2 rounded-lg"
    >
      View My Resume
    </Link>
  </div>
)}
            {/* Bottom Actions */}
            <div className="flex justify-center mt-10">
              <Link
                href="/userapplication"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
              >
                View Applications
                <ExternalLink className="ml-2" size={18} />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}