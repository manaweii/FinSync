import { useState } from "react";
// Path derived from Screenshot 2026-05-13 at 2.45.10 PM.png
import Footer from "../homepage/Footer"; 
import { 
  ChartBarIcon, 
  ClipboardDocumentCheckIcon, 
  FolderArrowDownIcon, 
  MagnifyingGlassCircleIcon, 
  ShieldCheckIcon, 
  QueueListIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  ShieldExclamationIcon
} from "@heroicons/react/24/outline";

const sections = [
  {
    id: "01",
    title: "Acceptance of Terms",
    content: [
      {
        type: "text",
        value: "By creating an account, purchasing a subscription, or accessing any part of the FinSync Platform, you confirm that you are at least 18 years of age, have the legal authority to bind yourself or your organization, and agree to comply with these Terms and our Privacy Policy.",
      },
      {
        type: "text",
        value: "If you are entering this Agreement on behalf of a company, you represent that you have the authority to bind that entity. If you do not have such authority, you must not accept these Terms.",
      },
    ],
  },
  {
    id: "02",
    title: "Platform Services",
    content: [
      {
        type: "text",
        value: "FinSync is a cloud-based SaaS financial management and analytics platform designed for organizations of all sizes. Core services include:",
      },
      {
        type: "grid",
        items: [
          { icon: <ChartBarIcon className="w-6 h-6" />, label: "Financial Dashboard", desc: "Real-time revenue, expenses & cash flow tracking" },
          { icon: <ClipboardDocumentCheckIcon className="w-6 h-6" />, label: "Automated Reporting", desc: "Scheduled & on-demand customizable reports" },
          { icon: <FolderArrowDownIcon className="w-6 h-6" />, label: "Data Import", desc: "Secure CSV & Excel file ingestion" },
          { icon: <MagnifyingGlassCircleIcon className="w-6 h-6" />, label: "Anomaly Detection", desc: "AI-assisted trend & irregularity identification" },
          { icon: <ShieldCheckIcon className="w-6 h-6" />, label: "Role-Based Access", desc: "Granular permission management across teams" },
          { icon: <QueueListIcon className="w-6 h-6" />, label: "Multi-Tenancy", desc: "Isolated, secure data environments per organization" },
        ],
      },
    ],
  },
  {
    id: "03",
    title: "Subscription & Billing",
    content: [
      {
        type: "text",
        value: "FinSync offers multiple subscription tiers billed in advance on a monthly or annual cycle. All fees are exclusive of applicable taxes.",
      },
      {
        type: "bullets",
        items: [
          "Payments are processed through designated gateways; FinSync does not store full card details.",
          "Overdue accounts may be suspended until outstanding balances are cleared.",
          "Cancellation takes effect at the end of the current billing period.",
          "Plan features, user limits, and storage quotas vary by tier.",
        ],
      },
    ],
  },
  {
    id: "04",
    title: "Data Ownership & Privacy",
    content: [
      {
        type: "highlight",
        value: "You retain full ownership of all Data you upload or generate through FinSync. We claim no intellectual property rights over your Data.",
      },
      {
        type: "text",
        value: "FinSync processes your Data solely to deliver the Services. We implement AES-256 encryption at rest and TLS 1.3 in transit.",
      },
    ],
  },
  {
    id: "05",
    title: "Acceptable Use",
    content: [
      {
        type: "text",
        value: "Users must not use FinSync to engage in any prohibited activities including fraudulent financial activities or reverse engineering components.",
      },
    ],
  },
  {
    id: "06",
    title: "Intellectual Property",
    content: [
      {
        type: "text",
        value: "All intellectual property rights in the FinSync Platform remain the exclusive property of FinSync Technologies Pvt. Ltd.",
      },
    ],
  },
];

export default function FinSyncTerms() {
  const [activeSection, setActiveSection] = useState("01");

  const handleScroll = (id) => {
    setActiveSection(id);
    const element = document.getElementById(`sec-${id}`);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 120,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
          
          {/* --- SIDEBAR NAVIGATION --- */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-32">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 px-3">Contents</p>
              <div className="space-y-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleScroll(s.id)}
                    className={`group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      activeSection === s.id 
                        ? "text-emerald-700 bg-emerald-50" 
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`mr-3 font-mono text-[10px] ${activeSection === s.id ? "text-emerald-500" : "text-slate-300"}`}>
                        {s.id}
                    </span>
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* --- CONTENT --- */}
          <div className="flex-1 max-w-3xl">
            <header className="mb-20">
              <h1 className="font-display text-5xl lg:text-7xl text-slate-900 mb-6 leading-tight">
                Terms of <br /><span className="text-emerald-500 italic font-light">Service</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed">
                By using FinSync, you agree to the following terms governing your access to our financial management and analytics platform.
              </p>
            </header>

            <div className="space-y-24">
              {sections.map((sec) => (
                <section key={sec.id} id={`sec-${sec.id}`} className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="font-mono text-xs font-bold text-emerald-500">{sec.id}</span>
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">{sec.title}</h2>
                    <div className="flex-1 h-[1px] bg-slate-100"></div>
                  </div>

                  <div className="space-y-6">
                    {sec.content.map((block, i) => {
                      if (block.type === "text") return (
                        <p key={i} className="text-[16px] text-slate-600 leading-8">{block.value}</p>
                      );
                      if (block.type === "highlight") return (
                        <div key={i} className="bg-emerald-50 border-l-2 border-emerald-500 p-6 my-8 rounded-r-xl flex gap-4">
                          <ShieldExclamationIcon className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                          <p className="text-emerald-900 font-medium leading-7 italic">{block.value}</p>
                        </div>
                      );
                      if (block.type === "bullets") return (
                        <ul key={i} className="grid gap-5 py-4">
                          {block.items.map((item, j) => (
                            <li key={j} className="flex gap-4 text-slate-600 text-sm leading-7">
                              <CheckBadgeIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      );
                      if (block.type === "grid") return (
                        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          {block.items.map((item, j) => (
                            <div key={j} className="p-5 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                              <div className="text-emerald-500 mb-4">{item.icon}</div>
                              <h4 className="text-sm font-bold text-slate-900 mb-1">{item.label}</h4>
                              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      );
                      return null;
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* --- LIGHT AGREEMENT CONFIRMATION --- */}
            <div className="mt-32 p-10 rounded-[2.5rem] bg-emerald-50/40 border border-emerald-100 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="max-w-md">
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3 font-display">Agreement Confirmation</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    By continuing to use FinSync, you acknowledge and agree to these simplified terms governing your platform usage, billing, and data privacy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}