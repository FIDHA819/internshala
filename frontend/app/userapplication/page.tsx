"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  Building2,
  Calendar,
  Mail,
  Tag,
  User,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import {
  useSelector,
} from "react-redux";

import {
  selectuser,
} from "../../Feature/userSlice";

export default function UserApplicationPage() {

  const user =
    useSelector(selectuser);

  const [
    searchTerm,
    setsearchTerm,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState("all");

  const [
    data,
    setdata,
  ] =
    useState<any[]>([]);

  const [
    loading,
    setloading,
  ] =
    useState(true);

  useEffect(() => {

    const fetchdata =
      async () => {

        try {

          setloading(true);

          const res =
            await axios.get(
              "http://localhost:5000/api/application"
            );

          setdata(
            res.data || []
          );

        } catch (
          error
        ) {

          console.log(
            error
          );

        } finally {

          setloading(
            false
          );
        }
      };

    fetchdata();

  }, []);

  const userapplications =
    useMemo(() => {

      return data.filter(
        (
          app: any
        ) =>
          app.user?.email ===
          user?.email
      );

    }, [
      data,
      user,
    ]);

  const stats = {

    total:
      userapplications.length,

    pending:
      userapplications.filter(
        (
          a
        ) =>
          a.status ===
          "pending"
      ).length,

    accepted:
      userapplications.filter(
        (
          a
        ) =>
          a.status ===
          "accepted"
      ).length,

    rejected:
      userapplications.filter(
        (
          a
        ) =>
          a.status ===
          "rejected"
      ).length,
  };

  const filtered =
    userapplications.filter(
      (
        application: any
      ) => {

        const matchSearch =

          application.company
            ?.toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            )

          ||

          application.category
            ?.toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            );

        if (
          filter ===
          "all"
        ) {
          return matchSearch;
        }

        return (
          matchSearch &&
          application.status ===
            filter
        );
      }
    );

  const getColor =
    (
      status:
        string
    ) => {

      if (
        status ===
        "accepted"
      ) {
        return "bg-green-100 text-green-700";
      }

      if (
        status ===
        "rejected"
      ) {
        return "bg-red-100 text-red-700";
      }

      return "bg-yellow-100 text-yellow-700";
    };

  if (
    loading
  ) {

    return (
      <div className="h-screen flex justify-center items-center">

        Loading...

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-xl shadow">

          <div className="p-6 border-b">

            <h1 className="text-3xl font-bold">

              My Applications

            </h1>

            <p className="text-gray-500">

              Logged in as

              {" "}

              {user?.name}

            </p>

          </div>

          {/* Dynamic stats */}

          <div className="grid grid-cols-4 gap-4 p-6">

            <div className="bg-blue-50 rounded p-4">

              <div className="text-3xl font-bold">

                {stats.total}

              </div>

              Total

            </div>

            <div className="bg-yellow-50 rounded p-4">

              <Clock3/>

              {stats.pending}

            </div>

            <div className="bg-green-50 rounded p-4">

              <CheckCircle2/>

              {stats.accepted}

            </div>

            <div className="bg-red-50 rounded p-4">

              <XCircle/>

              {stats.rejected}

            </div>

          </div>

          <div className="p-6">

            <input
              value={
                searchTerm
              }
              onChange={(e)=>
                setsearchTerm(
                  e.target.value
                )
              }
              placeholder="Search..."
              className="border p-3 w-full rounded"
            />

          </div>

          <div className="p-6 flex gap-3">

            {[
              "all",
              "pending",
              "accepted",
              "rejected",
            ].map(
              (
                item
              ) => (

                <button
                  key={
                    item
                  }
                  onClick={()=>
                    setFilter(
                      item
                    )
                  }
                  className={`px-4 py-2 rounded ${
                    filter ===
                    item
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100"
                  }`}
                >

                  {item}

                </button>

              )
            )}

          </div>

          <div className="divide-y">

            {filtered.length === 0 && (

              <div className="p-10 text-center">

                No applications found

              </div>

            )}

            {filtered.map(
              (
                application: any
              ) => (

                <div
                  key={
                    application._id
                  }
                  className="p-6 flex justify-between"
                >

                  <div>

                    <div className="font-bold">

                      {
                        application.company
                      }

                    </div>

                    <div>

                      {
                        application.category
                      }

                    </div>

                    <div className="text-sm text-gray-500">

                      {
                        new Date(
                          application.createdAt
                        )
                        .toLocaleDateString()

                      }

                    </div>

                  </div>

                  <span
                    className={`px-3 py-2 rounded ${getColor(
                      application.status
                    )}`}
                  >

                    {
                      application.status
                    }

                  </span>

                </div>

              )
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
