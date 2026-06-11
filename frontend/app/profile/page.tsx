"use client";

import {
  ExternalLink,
  Mail,
  User,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

import Link from "next/link";

import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  useSelector,
} from "react-redux";

import {
  selectuser,
} from "../../Feature/userSlice";

export default function Profilepage() {

  const user =
    useSelector(selectuser);

  const [
    applications,
    setApplications,
  ] = useState<any[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {

    const fetchApplications =
      async () => {

        try {

          setLoading(true);

          const res =
            await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/application`
            );

          const userApplications =
            res.data.filter(
              (app: any) =>
                app.user?.email ===
                user?.email
            );

          setApplications(
            userApplications
          );

        } catch (
          error
        ) {

          console.log(
            error
          );

        } finally {

          setLoading(
            false
          );
        }
      };

    if (user?.email) {
      fetchApplications();
    }

  }, [user]);

  const total =
    applications.length;

  const accepted =
    applications.filter(
      (app) =>
        app.status ===
        "accepted"
    ).length;

  const pending =
    applications.filter(
      (app) =>
        app.status ===
        "pending"
    ).length;

  const rejected =
    applications.filter(
      (app) =>
        app.status ===
        "rejected"
    ).length;

  if (
    loading
  ) {

    return (
      <div className="h-screen flex justify-center items-center">

        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/>

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

                <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">

                  <User size={50}/>

                </div>

              )}

            </div>

          </div>

          <div className="pt-20 pb-8 px-8">

            <div className="text-center">

              <h1 className="text-3xl font-bold">

                {
                  user?.name ||
                  "Guest User"
                }

              </h1>

              <div className="flex justify-center items-center mt-3 text-gray-500">

                <Mail
                  className="mr-2"
                  size={18}
                />

                {
                  user?.email
                }

              </div>

            </div>

            {/* Stats */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">

              <div className="bg-blue-50 p-5 rounded">

                <div className="text-3xl font-bold text-blue-700">

                  {total}

                </div>

                <p>

                  Applications

                </p>

              </div>

              <div className="bg-green-50 p-5 rounded">

                <div className="text-3xl font-bold text-green-700">

                  {accepted}

                </div>

                <p>

                  Accepted

                </p>

              </div>

              <div className="bg-yellow-50 p-5 rounded">

                <div className="text-3xl font-bold text-yellow-700">

                  {pending}

                </div>

                <p>

                  Pending

                </p>

              </div>

              <div className="bg-red-50 p-5 rounded">

                <div className="text-3xl font-bold text-red-700">

                  {rejected}

                </div>

                <p>

                  Rejected

                </p>

              </div>

            </div>

            {/* Buttons */}

            <div className="flex justify-center mt-10">

              <Link
                href="/userapplication"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >

                View Applications

                <ExternalLink
                  className="ml-2"
                  size={18}
                />

              </Link>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}