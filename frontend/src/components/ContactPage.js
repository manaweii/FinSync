import React from "react";
import Navbar from "./Navbar";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-emerald-50 flex flex-col">
      <Navbar isLoggedIn={false} />
      {/* Main content */}
      <main className="flex-1 px-4 py-10 md:py-16">
        <div className="mx-auto max-w-5xl">
          {/* Heading */}
          <section className="text-center mb-10 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Get in touch with the FinSync team
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
              Whether you have product questions, need support, or want a custom plan,
              we&apos;re here to help.
            </p>
          </section>

          {/* Card: contact info + form */}
          <section className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 p-6 md:p-8 flex flex-col md:flex-row gap-8">
            {/* Left side: contact info */}
            <div className="md:w-1/3 space-y-6">
              {/* Sales */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Sales</h2>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sky-500 text-lg">
                      ✉
                    </span>
                    sales@finsync.com
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sky-500 text-lg">
                      ☎
                    </span>
                    +1 (555) 123-4567
                  </p>
                </div>
              </div>

              {/* Support */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Support</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 text-lg">
                    ✉
                  </span>
                  support@finsync.com
                </p>
              </div>

              {/* Office */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Office</h2>
                <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sky-500 text-lg">
                    📍
                  </span>
                  <p>
                    123 Financial District
                    <br />
                    San Francisco, CA 94111
                    <br />
                    United States
                  </p>
                </div>
              </div>

              {/* Social links */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Follow Us</h2>
                <div className="mt-3 flex gap-3">
                  <button className="h-9 w-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center text-lg">
                    in
                  </button>
                  <button className="h-9 w-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center text-lg">
                    t
                  </button>
                  <button className="h-9 w-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center text-lg">
                    f
                  </button>
                </div>
              </div>

              {/* Response time */}
              <p className="pt-2 text-xs text-slate-500">
                Response time: <span className="font-medium">within 24 hours</span>
              </p>
            </div>

            {/* Right side: form */}
            <form
              className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={(e) => e.preventDefault()}
            >
              {/* Full name */}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-700 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {/* Work email */}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-700 mb-1">
                  Work email
                </label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {/* Company name */}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-700 mb-1">
                  Company name
                </label>
                <input
                  type="text"
                  placeholder="Your Company Inc."
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {/* Topic */}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-700 mb-1">
                  Topic
                </label>
                <input
                  type="text"
                  placeholder="How can we help?"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {/* Message (full width) */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-xs font-medium text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  rows="4"
                  placeholder="Tell us how we can help..."
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 resize-none"
                />
              </div>

              {/* Terms + button */}
              <div className="md:col-span-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                  />
                  <span>
                    I agree to the{" "}
                    <button className="text-sky-600 underline underline-offset-2">
                      Terms
                    </button>{" "}
                    and{" "}
                    <button className="text-sky-600 underline underline-offset-2">
                      Privacy Policy
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full md:w-auto rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-300 hover:brightness-105"
                >
                  Send message
                </button>
              </div>
            </form>
          </section>

          {/* Bottom help section */}
          <section className="mt-12 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              Need immediate help?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Check out our comprehensive resources for quick answers and guides.
            </p>
            <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-5 py-2 text-sm font-semibold text-sky-600 shadow-sm hover:bg-sky-50">
              <span className="text-lg">📘</span>
              View documentation
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
