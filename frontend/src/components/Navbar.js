import React from "react";
import { Link } from "react-router-dom";

function Navbar({ isLoggedIn }) {
  // links BEFORE login
  const publicLinks = ["Home", "Features", "Platform", "Pricing", "Contact"];

  // links AFTER login
  const privateLinks = ["Dashboard", "Analytics", "Import", "Report"];

  const linksToShow = isLoggedIn ? privateLinks : publicLinks;

  // map readable names to app routes
  const linkMap = {
    Home: "/landingpage",
    Features: "/#features",
    Platform: "/#platform",
    Pricing: "/pricing",
    Contact: "/contact",
    Dashboard: "/dashboard",
    Analytics: "/analytics",
    Import: "/import",
    Report: "/reports",
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* left: logo */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-semibold">
            F
          </div>
          <span className="text-lg font-semibold text-slate-900">
            <Link to="/">Fin<span className="text-emerald-600">Sync</span></Link>
          </span>
        </div>

        {/* center: nav links */}
        <div className="flex items-center gap-8 text-sm">
          {linksToShow.map((item) => (
            <Link
              key={item}
              to={linkMap[item] || "/"}
              className="text-slate-500 hover:text-emerald-600 transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* right side */}
        <div className="flex items-center">
          {isLoggedIn ? (
            // profile (after login)
            <div className="flex items-center gap-3 px-3 py-2 rounded-full border border-slate-100 shadow-sm bg-white">
              <div className="h-8 w-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-semibold">
                S
              </div>
              <div className="text-xs text-left">
                <p className="font-medium text-slate-800 leading-tight">Sarah Chen</p>
                <p className="text-[10px] text-slate-500 leading-tight">Premium Plan</p>
              </div>
            </div>
          ) : (
            // login button (before login)
            <Link to="/Login" className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-sm font-medium shadow-md hover:opacity-90">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
