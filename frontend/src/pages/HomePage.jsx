import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <header className="bg-white/80 backdrop-blur border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                MedAnnotate
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/auth?mode=signin"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
              >
                Sign In
              </Link>
              <Link
                to="/auth?mode=signup"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Oral Health Screening,
              <span className="text-blue-600"> simplified</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Upload, annotate, and generate professional oral health reports
              in minutes. Built for patients and admins with secure access and
              seamless workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth?mode=signup"
                className="inline-flex items-center px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/auth?mode=signin"
                className="inline-flex items-center px-5 py-3 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
              >
                I have an account
              </Link>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  What you can do
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Everything you need to manage oral health submissions and
                  reports.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="rounded-lg border p-4 bg-gray-50">
                  <p className="font-medium text-gray-900">
                    Patient Uploads
                  </p>
                  <p className="text-sm text-gray-600">
                    Securely upload images and track status updates.
                  </p>
                </div>
                <div className="rounded-lg border p-4 bg-gray-50">
                  <p className="font-medium text-gray-900">Admin Annotations</p>
                  <p className="text-sm text-gray-600">
                    Annotate images and add treatment recommendations.
                  </p>
                </div>
                <div className="rounded-lg border p-4 bg-gray-50">
                  <p className="font-medium text-gray-900">PDF Reports</p>
                  <p className="text-sm text-gray-600">
                    Generate professional reports with one click.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;