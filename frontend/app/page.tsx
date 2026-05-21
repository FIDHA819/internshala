"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import {
  ArrowUpRight,
  Banknote,
  Calendar,
  ChevronRight,
  MapPin,
} from "lucide-react";

import Link from "next/link";
import axios from "axios";

export default function SvgSlider() {
  const [internships, setInternships] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = [
    "Big Brands",
    "Work From Home",
    "Part-time",
    "MBA",
    "Engineering",
    "Media",
    "Design",
    "Data Science",
  ];

  const slides = [
    {
      title: "Start Your Career Journey",
      bg: "bg-indigo-600",
    },
    {
      title: "Learn From The Best",
      bg: "bg-blue-600",
    },
    {
      title: "Grow Your Skills",
      bg: "bg-purple-600",
    },
    {
      title: "Connect With Top Companies",
      bg: "bg-teal-600",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [internshipRes, jobRes] =
          await Promise.all([
            axios.get(
              "https://internshala-9pfr.onrender.com/api/internship"
            ),

            axios.get(
              "https://internshala-9pfr.onrender.com/api/job"
            ),
          ]);

        setInternships(
          internshipRes.data || []
        );

        setJobs(
          jobRes.data || []
        );
      } catch (error) {
        console.log(error);

        setInternships([]);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredInternships =
    internships.filter(
      (item) =>
        !selectedCategory ||
        item.category === selectedCategory
    );

  const filteredJobs =
    jobs.filter(
      (item) =>
        !selectedCategory ||
        item.category === selectedCategory
    );

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">

      <h1 className="text-4xl font-bold text-center mb-4">
        Make your dream career a reality
      </h1>

      <Swiper
        modules={[
          Navigation,
          Pagination,
          Autoplay,
        ]}
        navigation
        pagination={{
          clickable: true,
        }}
        autoplay={{
          delay: 3000,
        }}
      >
        {slides.map((slide) => (
          <SwiperSlide
            key={slide.title}
          >
            <div
              className={`${slide.bg} h-[350px] rounded-xl flex justify-center items-center`}
            >
              <h2 className="text-white text-4xl font-bold">
                {slide.title}
              </h2>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="my-10 flex flex-wrap gap-3">

        <button
          onClick={() =>
            setSelectedCategory("")
          }
          className="px-4 py-2 rounded bg-black text-white"
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setSelectedCategory(cat)
            }
            className="px-4 py-2 rounded bg-gray-100"
          >
            {cat}
          </button>
        ))}
      </div>

      <h2 className="text-3xl mb-6">
        Internships
      </h2>

      <div className="grid md:grid-cols-3 gap-5">

        {filteredInternships.map(
          (internship) => (
            <div
              key={internship._id}
              className="border rounded p-5"
            >
              <h3>
                {internship.title}
              </h3>

              <p>
                {internship.company}
              </p>

              <div className="space-y-2">

                <div className="flex gap-2">
                  <MapPin />
                  {internship.location}
                </div>

                <div className="flex gap-2">
                  <Banknote />
                  {internship.stipend}
                </div>

                <div className="flex gap-2">
                  <Calendar />
                  {internship.duration}
                </div>

              </div>

              <Link
                href={`/detailinternship/${internship._id}`}
              >
                View Details
              </Link>
            </div>
          )
        )}

      </div>

      <h2 className="text-3xl my-8">
        Jobs
      </h2>

      <div className="grid md:grid-cols-3 gap-5">

        {filteredJobs.map(
          (job) => (
            <div
              key={job._id}
              className="border rounded p-5"
            >
              <h3>{job.title}</h3>

              <p>{job.company}</p>

              <Link
                href={`/detailjob/${job._id}`}
              >
                View Details
              </Link>
            </div>
          )
        )}

      </div>
    </div>
  );
}