import React from "react";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
} from "react-icons/fa";
import Link from "next/link"
export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12">

      <div className="container mx-auto px-6">

        {/* Top Sections */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">

          <FooterSection
            title="Internship by places"
            items={[
              "New York",
              "Los Angeles",
              "Chicago",
              "San Francisco",
              "Miami",
              "Seattle",
            ]}
          />

          <FooterSection
            title="Internship by stream"
            items={[
              "About us",
              "Careers",
              "Press",
              "News",
              "Media kit",
              "Contact",
            ]}
          />

          <FooterSection
            title="Job Places"
            items={[
              "Blog",
              "Newsletter",
              "Events",
              "Help center",
              "Tutorials",
              "Supports",
            ]}
            links
          />

          <FooterSection
            title="Jobs by streams"
            items={[
              "Startups",
              "Enterprise",
              "Government",
              "SaaS",
              "Marketplaces",
              "Ecommerce",
            ]}
            links
          />

        </div>

        {/* Divider */}
        <hr className="my-10 border-gray-600" />

        {/* Bottom Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">

          <FooterSection
            title="About us"
            items={["Startups", "Enterprise"]}
            links
          />

          <FooterSection
            title="Team diary"
            items={["Startups", "Enterprise"]}
            links
          />

          <FooterSection
            title="Terms and conditions"
            items={["Startups", "Enterprise"]}
            links
          />

          <FooterSection
            title="Sitemap"
            items={["Startups"]}
            links
          />

        </div>

        {/* Bottom Area */}
        <div className="mt-10 flex flex-col sm:flex-row justify-between items-center">

          {/* App Button */}
          <p className="flex items-center gap-2 border border-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-700">
            Get Android App
          </p>

          {/* Social Icons */}
          <div className="flex space-x-4 mt-4 sm:mt-0">

            <FaFacebook className="w-6 h-6 hover:text-blue-400 cursor-pointer" />

            <FaTwitter className="w-6 h-6 hover:text-blue-400 cursor-pointer" />

            <FaInstagram className="w-6 h-6 hover:text-pink-400 cursor-pointer" />

          </div>

          {/* Copyright */}
          <p className="mt-4 sm:mt-0 text-sm text-gray-400">
            © Copyright 2026. All Rights Reserved.
          </p>

        </div>
      </div>
    </footer>
  );
}

/* Footer Section Component */
function FooterSection({
  title,
  items,
  links,
}: any) {
  return (
    <div>

      <h3 className="text-sm font-bold text-gray-300">
        {title}
      </h3>

      <div className="flex flex-col items-start mt-4 space-y-3">

        {items.map((item: any, index: any) =>
          links ? (
            <Link
              key={index}
              href="/"
              className="text-gray-400 hover:text-blue-400 hover:underline"
            >
              {item}
            </Link>
          ) : (
            <p
              key={index}
              className="text-gray-400 hover:text-blue-400 hover:underline cursor-pointer"
            >
              {item}
            </p>
          )
        )}

      </div>
    </div>
  );
}