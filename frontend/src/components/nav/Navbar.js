import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Initials from "./Initials";
import useAuthStore from "../../store/useAuthStore";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoggedIn, role, clearAuth } = useAuthStore();

  if (location.pathname === "/Login") {
    return null;
  }

  const publicLinks = ["Home", "Features", "Platform", "Pricing", "Contact"];
  const privateLinks = ["Dashboard", "Import", "Record", "Report"];
  const linksToShow = isLoggedIn ? privateLinks : publicLinks;

  const linkMap = {
    Home: "/",
    Features: "/#features",
    Platform: "/#platform",
    Pricing: "/pricing",
    Contact: "/contact",
    Dashboard: "/dashboard",
    Record: "/record",
    Import: "/import",
    Report: "/reports",
    Users: "/users",
    Organization: "/organizations",
    Profile: "/profile",
  };

  const logoPath = isLoggedIn ? "/dashboard" : "/";

  const handleLogoutClick = () => {
    // use zustand to clear in-memory auth
    clearAuth();
    setIsOpen(false);
    navigate("/Login");
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* left: logo */}
        <div className="flex items-center gap-3">
          <Link to={logoPath} className="flex items-center gap-3">
            <img
              src="./FinSync.png"
              alt="FinSync Logo"
              className="h-40 w-40 object-contain"
            />
          </Link>
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
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-full border border-slate-100 shadow-sm bg-white"
              >
                <div className="h-8 w-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-semibold">
                  <Initials name={user?.fullName || "U"} />
                </div>
                <div className="text-xs text-left">
                  <p className="font-medium text-slate-800 leading-tight">
                    {user?.fullName || "User"}
                  </p>
                </div>
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg py-1 text-sm">
                  {role === "Superadmin" && (
                    <Link
                      to={linkMap.Organization}
                      className="block px-4 py-2 text-slate-700 hover:bg-slate-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Organization
                    </Link>
                  )}

                  {(role === "Admin" || role === "Superadmin") && (
                    <Link
                      to={linkMap.Users}
                      className="block px-4 py-2 text-slate-700 hover:bg-slate-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Users
                    </Link>
                  )}

                  <Link
                    to={linkMap.Profile}
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-50"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>

                  <Link
                    to="/dashboard-settings"
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/dashboard-settings");
                    }}
                  >
                    Settings
                  </Link>

                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/Login"
              className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-sm font-medium shadow-md hover:opacity-90"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
