import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Initials from "./Initials";
import NotificationFeed from "./NotificationFeed";
import useAuthStore from "../../store/useAuthStore";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { user, isLoggedIn, role, clearAuth } = useAuthStore();

  const publicLinks = ["Home", "Features", "Platform", "Pricing", "Contact"];
  const privateLinks = ["Dashboard", "Import", "Record", "Prediction", "Report"];
  const linksToShow = isLoggedIn ? privateLinks : publicLinks;

  const linkMap = {
    Home: "/",
    Features: "/#featureSection",
    Platform: "/#platformSection",
    Pricing: "/pricing",
    Contact: "/contact",
    Dashboard: "/dashboard",
    Record: "/records",
    Prediction: "/predictions",
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (location.pathname === "/Login") {
    return null;
  }

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
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <NotificationFeed userRole={role} />

              <div ref={profileMenuRef} className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-3 rounded-full border border-slate-100 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-white">
                    <Initials name={user?.fullName || "U"} />
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-medium leading-tight text-slate-800">
                      {user?.fullName || "User"}
                    </p>
                  </div>
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white py-1 text-sm shadow-lg">
                    {role === "Superadmin" && (
                      <Link
                        to={linkMap.Organization}
                        className="block px-4 py-2 text-slate-700 hover:bg-slate-50"
                        onClick={() => setIsOpen(false)}
                      >
                        Organization
                      </Link>
                    )}

                    {role === "Admin" && (
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
            </>
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
