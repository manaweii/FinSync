import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/homepage/Footer";

const IconWrapper = ({ children, className = "" }) => (
  <span
    className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${className}`}
    aria-hidden="true"
  >
    {children}
  </span>
);

const MailIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-none stroke-current"
    strokeWidth="1.8"
  >
    <path d="M4 7.5h16v9A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-9Z" />
    <path d="m5 8 7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PhoneIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-none stroke-current"
    strokeWidth="1.8"
  >
    <path
      d="M7.5 4.5h2.1c.4 0 .74.28.83.67l.74 3.22a.9.9 0 0 1-.26.86l-1.42 1.42a13.03 13.03 0 0 0 3.83 3.83l1.42-1.42a.9.9 0 0 1 .86-.26l3.22.74c.39.09.67.43.67.83v2.1a1.5 1.5 0 0 1-1.5 1.5h-.75C10.7 18 6 13.3 6 7.5v-.75A1.5 1.5 0 0 1 7.5 4.5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PinIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-none stroke-current"
    strokeWidth="1.8"
  >
    <path
      d="M12 20s5-4.8 5-9a5 5 0 1 0-10 0c0 4.2 5 9 5 9Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="11" r="1.75" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M6.94 8.5H4.56V19h2.38V8.5ZM5.75 4.7a1.38 1.38 0 1 0 0 2.75 1.38 1.38 0 0 0 0-2.75ZM19.44 12.58c0-2.64-1.41-4.08-3.3-4.08-1.52 0-2.2.84-2.58 1.43V8.5h-2.38V19h2.38v-5.5c0-1.45.27-2.85 2.07-2.85 1.77 0 1.8 1.66 1.8 2.94V19h2.38v-6.42Z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M17.96 4H20l-4.46 5.1L20.8 20h-4.13l-3.24-4.24L9.72 20H7.68l4.77-5.45L3.4 4h4.23l2.93 3.84L17.96 4Zm-1.45 14.38h1.14L6.86 5.54H5.64l10.87 12.84Z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M13.33 20v-6.3h2.12l.32-2.46h-2.44V9.67c0-.71.2-1.2 1.22-1.2h1.3V6.26c-.22-.03-1-.1-1.89-.1-1.87 0-3.15 1.14-3.15 3.23v1.85H8.7v2.46h2.1V20h2.53Z" />
  </svg>
);

const ContactPage = () => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    topic: "",
    message: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    if (!form.name || !form.email || !form.message) {
      setError("Please fill required fields (name, email, message).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/contact/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          topic: form.topic,
          message: form.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send message");
      setSuccess("Message sent successfully. Our team will reply shortly.");
      setForm({
        name: "",
        email: "",
        company: "",
        topic: "",
        message: "",
        agree: false,
      });
    } catch (err) {
      console.error("Contact send error", err);
      setError(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-emerald-50 flex flex-col">
      {/* Main content */}
      <main className="flex-1 px-4 py-10 md:py-16">
        <div className="mx-auto max-w-5xl">
          {/* Heading */}
          <section className="text-center mb-10 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Get in touch with the FinSync team
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
              Whether you have product questions, need support, or want a custom
              plan, we&apos;re here to help.
            </p>
          </section>

          {/* Card: contact info + form */}
          <section className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 p-6 md:p-8 flex flex-col md:flex-row gap-8">
            {/* Left side: contact info */}
            <div className="md:w-1/3 space-y-6">
              {/* Support */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Support
                </h2>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <IconWrapper className="bg-sky-50 text-sky-500">
                      <MailIcon />
                    </IconWrapper>
                    finsync2026@gmail.com
                  </p>
                  <p className="flex items-center gap-2">
                    <IconWrapper className="bg-sky-50 text-sky-500">
                      <PhoneIcon />
                    </IconWrapper>
                    +977 980814567
                  </p>
                </div>
              </div>

              {/* Office */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Office</h2>
                <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                  <IconWrapper className="mt-0.5 bg-teal-50 text-teal-500">
                    <PinIcon />
                  </IconWrapper>
                  <p>
                    123 Marg
                    <br />
                    Lalitpur, NP 44700
                    <br />
                    Nepal
                  </p>
                </div>
              </div>

              {/* Social links */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Follow Us
                </h2>
                <div className="mt-3 flex gap-3">
                  <button
                    className="h-9 w-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center"
                    aria-label="LinkedIn"
                  >
                    <LinkedInIcon />
                  </button>
                  <button
                    className="h-9 w-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center"
                    aria-label="X"
                  >
                    <XIcon />
                  </button>
                  <button
                    className="h-9 w-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center"
                    aria-label="Facebook"
                  >
                    <FacebookIcon />
                  </button>
                </div>
              </div>

              {/* Response time */}
              <p className="pt-2 text-xs text-slate-500">
                Response time:{" "}
                <span className="font-medium">within 24 hours</span>
              </p>
            </div>

            {/* Right side: form */}
            <form
              className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={handleSubmit}
            >
              {/* Full name */}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-700 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>

              {/* Work email */}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-700 mb-1">
                  Work email
                </label>
                <input
                  type="email"
                  placeholder="email@company.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  required
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
                  value={form.company}
                  onChange={(e) => handleChange("company", e.target.value)}
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
                  value={form.topic}
                  onChange={(e) => handleChange("topic", e.target.value)}
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
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 resize-none"
                  required
                />
              </div>

              {/* Terms + button */}
              <div className="md:col-span-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.agree}
                    onChange={(e) => handleChange("agree", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                  />
                  <span className="text-sm text-slate-600">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/terms-conditions")}
                      className="text-sky-600 underline underline-offset-2 hover:text-sky-700 transition-colors"
                    >
                      Terms
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/terms-conditions")}
                      className="text-sky-600 underline underline-offset-2 hover:text-sky-700 transition-colors"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>

                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-300 hover:brightness-105"
                  >
                    {loading ? "Sending..." : "Send message"}
                  </button>
                </div>
              </div>

              {success && (
                <div className="md:col-span-2 text-green-600 text-sm">
                  {success}
                </div>
              )}
              {error && (
                <div className="md:col-span-2 text-red-600 text-sm">
                  {error}
                </div>
              )}
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
