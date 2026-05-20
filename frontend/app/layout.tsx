import type { Metadata } from "next";
import "./globals.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Providers from "./provider";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
  title: "Intern Area",
  description: "Internship & Job Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>

        <Providers>
          <Navbar />

          {children}

          <Footer />

          <ToastContainer
            position="top-right"
            autoClose={3000}
          />
        </Providers>

      </body>
    </html>
  );
}