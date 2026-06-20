"use client";

import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResumeViewPage() {
  const { id } = useParams();

  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/resume/id/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setResume(res.data.resume);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResume();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading Resume...
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="p-10 text-center">
        Resume Not Found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-10 shadow mt-10 rounded">

      <h1 className="text-3xl font-bold">
        {resume.name}
      </h1>

      <p>{resume.email}</p>

      <p>{resume.phone}</p>

      <p>{resume.address}</p>

      <hr className="my-6" />

      <h2 className="font-bold text-xl">
        Qualification
      </h2>

      <p>{resume.qualification}</p>

      <h2 className="font-bold text-xl mt-6">
        Experience
      </h2>

      <p>{resume.experience}</p>

      <h2 className="font-bold text-xl mt-6">
        Skills
      </h2>

      <p>{resume.skills}</p>

    </div>
  );
}