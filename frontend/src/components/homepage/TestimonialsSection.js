import React from "react";

const Testimonials = () => {
  const testimonials = [
    {
      initials: "SC",
      name: "Sarah Chen",
      role: "CFO, TechVentures Inc",
      quote:
        "FinSync transformed how we manage our finances. The anomaly detection caught a billing error that saved us $50K. The ROI was immediate.",
      color: "bg-teal-500",
    },
    {
      initials: "MR",
      name: "Michael Rodriguez",
      role: "Finance Director, GrowthCo",
      quote:
        "The automated reporting feature alone saves our team 20 hours a week. The multi-tenant security gives us complete peace of mind.",
      color: "bg-teal-500",
    },
    {
      initials: "ET",
      name: "Emily Thompson",
      role: "CEO, Innovate Solutions",
      quote:
        "We've tried other platforms, but FinSync's personalized dashboards and real-time insights are unmatched. It's become essential to our operations.",
      color: "bg-teal-500",
    },
  ];

  const companies = [
    { name: "RentWheels", abbr: "RW" },
    { name: "BakeAndBite", abbr: "BB" },
    { name: "DataFlow", abbr: "DF" },
    { name: "GrowthLabs", abbr: "GL" },
    { name: "CloudSync", abbr: "CS" },
    { name: "Innovate", abbr: "IN" },
  ];

  return (
    <section className="bg-white py-20 px-4 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto text-center">
        {/* Header Section */}
        <div className="mb-16">
          {/* small label */}
          <span className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1 text-xs font-medium text-teal-600 mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-6 mb-4 text-slate-900">
            Trusted by Finance Leaders
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Join hundreds of organizations that have transformed their financial
            management with FinSync.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="border border-slate-100 rounded-3xl p-8 text-left flex flex-col shadow-sm"
            >
              {/* Quote Icon */}
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center mb-6">
                <span className="text-white text-xl font-serif">"</span>
              </div>

              {/* Star Rating */}
              <div className="flex mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">
                    ★
                  </span>
                ))}
              </div>

              {/* Quote Text */}
              <p className="text-slate-600 mb-8 flex-grow leading-relaxed">
                "{t.quote}"
              </p>

              {/* Divider line style */}
              <div className="border-t border-slate-100 pt-6 flex items-center">
                <div
                  className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center text-white font-medium mr-4`}
                >
                  {t.initials}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{t.name}</h4>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Logo Section */}
        <div className="border-t border-slate-100 pt-16">
          <p className="text-slate-500 text-sm mb-10 uppercase tracking-wide">
            Trusted by leading organizations
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {companies.map((c, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-20 h-20 md:w-24 md:h-24 border border-slate-100 rounded-xl flex items-center justify-center mb-2 bg-white">
                  <span className="text-2xl font-light text-slate-300 tracking-tighter">
                    {c.abbr}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
