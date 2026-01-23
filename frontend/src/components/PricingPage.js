import React from "react";
import Navbar from "./Navbar";

const plans = [
  {
    name: "Starter",
    price: "NPR 1,500",
    period: "/ month",
    badge: "",
    badgeColor: "",
  },
  {
    name: "Growth",
    price: "NPR 3,900",
    period: "/ 3 months",
    badge: "Save 13%",
    badgeColor: "bg-emerald-100 text-emerald-600",
  },
  {
    name: "Professional",
    price: "NPR 7,200",
    period: "/ 6 months",
    badge: "Save 20%",
    badgeColor: "bg-emerald-100 text-emerald-600",
    highlight: "Most Popular",
    highlightColor: "bg-emerald-100 text-emerald-600",
  },
  {
    name: "Enterprise",
    price: "NPR 13,000",
    period: "/ year",
    badge: "Best Value",
    badgeColor: "bg-amber-100 text-amber-600",
    highlight: "Best Value",
    highlightColor: "bg-amber-100 text-amber-600",
  },
];

const faqs = [
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, debit cards, and bank transfers for NPR payments.",
  },
  {
    q: "Is there a free trial available?",
    a: "Yes! We offer a 14-day free trial with full access to all features. No credit card required.",
  },
];

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar isLoggedIn={false} />
      {/* Hero + pricing cards */}
      <main className="mx-auto max-w-6xl px-4 pt-12 pb-20 md:px-6 md:pt-16">
        {/* Hero */}
        <section className="text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Pricing
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Flexible pricing for every business.
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-sm md:text-base text-slate-600">
            Choose a plan that fits your growth. All plans include core financial dashboards, CSV/Excel import, basic reports and analytics, and email support.
          </p>
        </section>

        {/* Pricing cards */}
        <section className="mt-10 grid gap-6 md:mt-12 md:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                plan.name === "Professional" || plan.name === "Enterprise"
                  ? "border-emerald-100 shadow-emerald-50"
                  : "border-slate-100"
              }`}
            >
              {/* Top highlight label (Most Popular / Best Value) */}
              {plan.highlight && plan.name === "Professional" && (
                <div className="absolute inset-x-0 -top-4 flex justify-center">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
                    Most Popular
                  </span>
                </div>
              )}
              {plan.highlight && plan.name === "Enterprise" && (
                <div className="absolute inset-x-0 -top-4 flex justify-center">
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
                    Best Value
                  </span>
                </div>
              )}

              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                {plan.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">
                  {plan.price}
                </span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>

              {plan.badge && (
                <span
                  className={`mt-2 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    plan.badgeColor
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 text-xs">
                    ✓
                  </span>
                  Core financial dashboards
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 text-xs">
                    ✓
                  </span>
                  CSV/Excel import
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 text-xs">
                    ✓
                  </span>
                  Basic reports and analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 text-xs">
                    ✓
                  </span>
                  Email support
                </li>
              </ul>

              <button
                className={`mt-6 w-full rounded-full px-4 py-2.5 text-sm font-semibold ${
                  plan.name === "Professional"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:brightness-105"
                    : "border border-emerald-100 bg-white text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </section>

        {/* Bottom section: custom plan + FAQ */}
        <section className="mt-16 grid gap-8 rounded-2xl bg-white p-8 shadow-sm md:grid-cols-[1.1fr,1.4fr]">
          {/* Custom plan */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Need a custom plan?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              We offer tailored solutions for enterprises with specific requirements. Get in touch with our sales team to discuss your needs.
            </p>
            <button className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Contact Us
            </button>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Frequently Asked Questions
            </h2>
            <div className="mt-4 space-y-5">
              {faqs.map((item) => (
                <div key={item.q}>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {item.q}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PricingPage;
