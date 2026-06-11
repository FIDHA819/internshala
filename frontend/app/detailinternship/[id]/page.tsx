"use client";

import axios from "axios";
import {
  ArrowUpRight,
  Calendar,
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

import { useSelector } from "react-redux";
import { selectuser } from "../../../Feature/userSlice";

import { toast } from "react-toastify";

export default function Detailinternshippage() {

  const router = useRouter();

  const params = useParams();

  const id = params.id;

  const user =
    useSelector(selectuser);

  const [
    internshipData,
    setinternship,
  ] = useState<any>(null);

  const [
    loading,
    setloading,
  ] = useState(true);

  const [
    availability,
    setAvailability,
  ] = useState("");

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    coverLetter,
    setCoverLetter,
  ] = useState("");

  useEffect(() => {

    const fetchdata =
      async () => {

        try {

          setloading(true);

          const res =
            await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/internship/${id}`
            );

          setinternship(
            res.data
          );

        } catch (
          error
        ) {

          console.log(
            error
          );

          toast.error(
            "Internship not found"
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
          "Please write cover letter"
        );

        return;
      }

      if (
        !availability
      ) {
        toast.error(
          "Select availability"
        );

        return;
      }

      try {

        const applicationData =
          {
            category:
              internshipData.category,

            company:
              internshipData.company,

            coverLetter,

            user,

            Application:
              id,

            availability,
          };

        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/application`,

          applicationData
        );

        toast.success(
          "Application submitted"
        );

        setIsModalOpen(
          false
        );

        router.push(
          "/internship"
        );

      } catch (
        error
      ) {

        console.log(
          error
        );

        toast.error(
          "Submission failed"
        );
      }
    };

  if (
    loading
  ) {
    return (
      <div className="h-screen flex justify-center items-center">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />

      </div>
    );
  }

  if (
    !internshipData
  ) {
    return (
      <div className="text-center p-10">
        Internship not found
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">

      <div className="bg-white rounded-lg shadow">

        <div className="p-6">

          <div className="flex gap-2 text-blue-600">

            <ArrowUpRight />

            Actively Hiring

          </div>

          <h1 className="text-3xl font-bold mt-4">

            {internshipData.title}

          </h1>

          <p className="text-gray-600">

            {internshipData.company}

          </p>

          <div className="grid md:grid-cols-3 gap-5 mt-6">

            <div className="flex gap-2">

              <MapPin />

              {internshipData.location}

            </div>

            <div className="flex gap-2">

              <DollarSign />

              {internshipData.stipend}

            </div>

            <div className="flex gap-2">

              <Calendar />

              {
                internshipData.startDate
              }

            </div>

          </div>

          <div className="mt-4 flex gap-2">

            <Clock />

            Posted recently

          </div>

        </div>

        <div className="border-t p-6">

          <h2 className="text-xl font-bold">

            About Company

          </h2>

          <p>

            {
              internshipData.aboutCompany
            }

          </p>

        </div>

        <div className="border-t p-6">

          <h2 className="text-xl font-bold">

            About Internship

          </h2>

          <p>
            {
              internshipData.aboutInternship
            }
          </p>

          <h3 className="font-bold mt-5">

            Who can apply

          </h3>

          <p>
            {
              internshipData.whoCanApply
            }
          </p>

          <h3 className="font-bold mt-5">

            Perks

          </h3>

          <p>
            {
              internshipData.perks
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
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white rounded-lg w-[650px] p-6">

      <div className="flex justify-between items-center">

        <h2 className="text-2xl font-bold">

          Apply to {internshipData.company}

        </h2>

        <button
          onClick={() =>
            setIsModalOpen(false)
          }
        >
          <X />
        </button>

      </div>

      <div className="mt-6">

        <h3 className="font-semibold mb-2">

          Cover Letter

        </h3>

        <textarea
          value={coverLetter}
          onChange={(e) =>
            setCoverLetter(
              e.target.value
            )
          }
          className="w-full h-32 border rounded p-3 text-black"
          placeholder="Why should you be selected?"
        />

      </div>

      <div className="mt-6">

        <h3 className="font-semibold mb-3">

          Availability

        </h3>

        <div className="space-y-3">

          {[
            "Available immediately",

            "Notice period",

            "After graduation",

            "Other",

          ].map((option) => (

            <label
              key={option}
              className="flex gap-2"
            >

              <input
                type="radio"
                name="availability"
                value={option}
                checked={
                  availability === option
                }
                onChange={(e) =>
                  setAvailability(
                    e.target.value
                  )
                }
              />

              <span>

                {option}

              </span>

            </label>

          ))}

        </div>

      </div>

      <div className="flex justify-end mt-8">

        {user ? (

          <button
            onClick={
              handlesubmitapplication
            }
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >

            Submit Application

          </button>

        ) : (

          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >

            Sign in to Apply

          </Link>

        )}

      </div>

    </div>

  </div>
)}

    </div>
  );
}