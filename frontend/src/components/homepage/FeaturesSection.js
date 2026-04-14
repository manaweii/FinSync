import React from "react";
import { 
  ShieldCheckIcon, 
  SquaresPlusIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  CircleStackIcon,
  TableCellsIcon 
} from "@heroicons/react/24/outline";

const features = [
  {
    title: "Role-based Access Control",
    description:
      "Secure your data with permissions and role management. Control who sees what across your organization.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Personalized Dashboards",
    description:
      "Customize your view with drag-and-drop widgets. See the metrics that matters most.",
    icon: SquaresPlusIcon,
  },
  {
    title: "Automated Reporting",
    description:
      "Generate financial reports automatically. Download in PDF or Excel format with a single click.",
    icon: DocumentTextIcon,
  },
  {
    title: "Analytics & Anomaly Detection",
    description:
      "Insights identify unusual patterns and trends. Stay ahead of financial risks with alerts.",
    icon: ChartBarIcon,
  },
  {
    title: "Secure Multi-tenant Data Management",
    description:
      "Enterprise-grade security with complete data isolation. Your information is protected.",
    icon: CircleStackIcon,
  },
  {
    title: "Import via CSV or Excel",
    description:
      "Seamlessly import your existing data from spreadsheets. Map fields automatically and start analyzing immediately.",
    icon: TableCellsIcon,
  },
];

function FeaturesSection() {
  return (
    <section id="featureSection" className="bg-white py-20 px-4">
      <div className="max-w-5xl mx-auto text-center">
        {/* small label */}
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-600 mb-6 tracking-wide">
          Features
        </span>

        {/* main heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">
          Everything You Need to Manage
          <br />
          Your Finances
        </h2>

        {/* subtitle */}
        <p className="text-sm md:text-base text-slate-500 mb-14 max-w-2xl mx-auto">
          Powerful tools designed to give you complete control and visibility
          over your financial operations.
        </p>

        {/* grid of cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-3xl border border-slate-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.03)] p-8 text-left transition-all hover:shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
            >
              {/* Icon with Gradient Container */}
              <div className="mb-6 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 via-emerald-400 to-emerald-500 flex items-center justify-center shadow-sm">
                <feature.icon className="h-6 w-6 text-white" strokeWidth={1.5} />
              </div>

              {/* text content */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-[14px] text-slate-500 leading-relaxed font-normal">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;