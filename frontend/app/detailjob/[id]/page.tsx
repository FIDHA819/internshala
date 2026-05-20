"use client";

import axios from "axios";
import {
  ArrowUpRight,
  Book,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  X,
} from "lucide-react";

import Link from "next/link";

import {
  useRouter,
  useParams,
} from "next/navigation";

import React, {
  useEffect,
  useState,
} from "react";

import {
  useSelector,
} from "react-redux";

import {
  selectuser,
} from "../../../Feature/userSlice";

import {
  toast,
} from "react-toastify";

export default function Detailjob() {

  const router =
    useRouter();

  const params =
    useParams();

  const id =
    params.id;

  const user =
    useSelector(
      selectuser
    );

  const [
    jobdata,
    setjob,
  ] =
    useState<any>(
      null
    );

  const [
    loading,
    setloading,
  ] =
    useState(
      true
    );

  const [
    availability,
    setAvailability,
  ] =
    useState("");

  const [
    coverLetter,
    setCoverLetter,
  ] =
    useState("");

  const [
    isModalOpen,
    setIsModalOpen,
  ] =
    useState(
      false
    );

  useEffect(() => {

    const fetchdata =
      async () => {

        try {

          setloading(
            true
          );

          const res =
            await axios.get(
              `http://localhost:5000/api/job/${id}`
            );

          setjob(
            res.data
          );

        } catch (
          error
        ) {

          console.log(
            error
          );

          toast.error(
            "Job not found"
          );

        } finally {

          setloading(
            false
          );
        }
      };

    if (id) {
      fetchdata();
    }

  }, [id]);

  const handlesubmitapplication =
    async () => {

      if (
        !coverLetter.trim()
      ) {
        toast.error(
          "Write cover letter"
        );

        return;
      }

      if (
        !availability
      ) {
        toast.error(
          "Choose availability"
        );

        return;
      }

      try {

        const data =
          {
            category:
              jobdata.category,

            company:
              jobdata.company,

            coverLetter,

            user,

            Application:
              id,

            availability,
          };

        await axios.post(
          "http://localhost:5000/api/application",

          data
        );

        toast.success(
          "Application submitted"
        );

        router.push(
          "/job"
        );

      } catch (
        error
      ) {

        console.log(
          error
        );

        toast.error(
          "Submit failed"
        );
      }
    };

  if (
    loading
  ) {

    return (
      <div className="h-screen flex justify-center items-center">

        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/>

      </div>
    );
  }

  if (
    !jobdata
  ) {

    return (
      <div className="text-center mt-20">
        Job not found
      </div>
    );
  }

  return (

    <div className="max-w-5xl mx-auto p-8">

      <div className="bg-white rounded-lg shadow">

        <div className="p-6">

          <div className="flex gap-2 text-blue-600">

            <ArrowUpRight/>

            Actively Hiring

          </div>

          <h1 className="text-3xl font-bold mt-4">

            {jobdata.title}

          </h1>

          <p className="text-gray-600">

            {jobdata.company}

          </p>

          <div className="grid md:grid-cols-3 gap-5 mt-6">

            <div className="flex gap-2">

              <MapPin/>

              {jobdata.location}

            </div>

            <div className="flex gap-2">

              <DollarSign/>

              {jobdata.CTC}

            </div>

            <div className="flex gap-2">

              <Book/>

              {jobdata.category}

            </div>

          </div>

          <div className="mt-4 flex gap-2">

            <Clock/>

            Posted:
            {
              jobdata.createAt
            }

          </div>

        </div>

        <div className="border-t p-6">

          <h2 className="font-bold text-xl">

            About Company

          </h2>

          <p>

            {
              jobdata.aboutCompany
            }

          </p>

        </div>

        <div className="border-t p-6">

          <h2 className="font-bold text-xl">

            About Job

          </h2>

          <p>

            {
              jobdata.aboutJob
            }

          </p>

          <h3 className="mt-5 font-bold">

            Who can apply

          </h3>

          <p>

            {
              jobdata.whoCanApply
            }

          </p>

          <h3 className="mt-5 font-bold">

            Perks

          </h3>

          <p>

            {
              jobdata.perks
            }

          </p>

        </div>

        <div className="p-6">

          <button
            onClick={() =>
              setIsModalOpen(
                true
              )
            }
            className="bg-blue-600 text-white px-6 py-3 rounded"
          >

            Apply Now

          </button>

        </div>

      </div>

   {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Apply to {jobdata.company}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Resume Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Resume
                </h3>
                <p className="text-gray-600">
                  Your current resume will be submitted with the application
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Cover Letter
                </h3>
                <p className="text-gray-600 mb-2">
                  Why should you be selected for this internship?
                </p>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Write your cover letter here..."
                ></textarea>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Availability
                </h3>
                <div className="space-y-3">
                  {[
                    "Yes, I am available to join immediately",
                    "No, I am currently on notice period",
                    "No, I will have to serve notice period",
                    "Other",
                  ].map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name=""
                        id=""
                        value={option}
                        checked={availability === option}
                        onChange={(e) => setAvailability(e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-4">
                {user ? (
                  <button
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    onClick={handlesubmitapplication}
                  >
                    Submit Application
                  </button>
                ) : (
                  <Link
                    href={`/`}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Sign up to apply
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    

    </div>
  );
}