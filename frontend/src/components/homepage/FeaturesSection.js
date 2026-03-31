import React from "react";

const features = [
  {
    title: "Role-based Access Control",
    description:
      "Secure your data with granular permissions and role management. Control who sees what across your organization.",
  },
  {
    title: "Personalized Dashboards",
    description:
      "Customize your view with drag-and-drop widgets. See the metrics that matter most to your role.",
  },
  {
    title: "Automated Reporting",
    description:
      "Generate financial reports automatically. ",
  },
  {
    title: "In-depth Analytics & Anomaly Detection",
    description:
      "AI-powered insights identify unusual patterns and trends. Stay ahead of financial risks with real-time alerts.",
  },
  {
    title: "Secure Multi-tenant Data Management",
    description:
      "Enterprise-grade security with complete data isolation. Your information is protected with encryption at rest and in transit.",
  },
  {
    title: "Import via CSV or Excel",
    description:
      "Seamlessly import your existing data from spreadsheets. Map fields automatically and start analyzing immediately.",
  },
];

function FeaturesSection() {
  return (
    <section id="featureSection" className="bg-white py-16 px-4">
      <div className="max-w-5xl mx-auto text-center">
        {/* small label */}
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-600 mb-4">
          Features
        </span>

        {/* main heading */}
        <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight mb-3">
          Everything You Need to Manage
          <br />
          Your Finances
        </h2>

        {/* subtitle */}
        <p className="text-sm md:text-base text-slate-500 mb-10 max-w-2xl mx-auto">
          Powerful tools designed to give you complete control and visibility
          over your financial operations.
        </p>

        {/* grid of cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-100 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.04)] px-6 py-6 text-left flex gap-4"
            >
              {/* icon placeholder */}
              <div className="mt-1 h-10 w-10 flex-shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white text-lg">
                •
              </div>

              {/* text content */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* bottom text */}
        <p className="mt-10 text-xs text-slate-400">
          Ready to transform your financial management?
        </p>
      </div>
    </section>
  );
}

export default FeaturesSection;
