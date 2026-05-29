import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Initials from "./Initials";
import NotificationFeed from "./NotificationFeed";
import useAuthStore from "../../store/useAuthStore";
import { isAdminRole, isSuperadminRole } from "../../utils/roles";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Home");
  const profileMenuRef = useRef(null);
  const { user, isLoggedIn, role, clearAuth } = useAuthStore();
  const isSuperadmin = isSuperadminRole(user?.role || role);
  const isAdmin = isAdminRole(user?.role || role);

  const publicLinks = ["Home", "Features", "Platform", "Pricing", "Contact"];
  const privateLinks = ["Dashboard", "Import", "Record", "Prediction", "Report"];
  const linksToShow = isLoggedIn
    ? isSuperadmin
      ? []
      : privateLinks
    : publicLinks;

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
    clearAuth();
    setIsOpen(false);
    navigate("/Login");
  };

  const handleSectionScroll = (e, path, item) => {
    // If it's the Home link, scroll to top
    if (item === "Home" && location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSection("Home");
      window.history.pushState(null, "", "/");
      return;
    }

    // If it's a hash link on the same page, scroll to section
    if (path.includes("#") && location.pathname === "/") {
      e.preventDefault();
      const hash = path.split("#")[1];
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${hash}`);
        setActiveSection(item);
      }
    }
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Detect which section is currently in view or update base on hash on initial load
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection(null);
      return;
    }

    // If there's an immediate hash on load, map it correctly
    if (location.hash === "#featureSection") setActiveSection("Features");
    else if (location.hash === "#platformSection") setActiveSection("Platform");
    else setActiveSection("Home");

    const handleScroll = () => {
      const sections = [
        { id: "featureSection", name: "Features" },
        { id: "platformSection", name: "Platform" },
      ];

      let currentSection = "Home";

      // If user is near the top of the viewport, fallback to Home
      if (window.scrollY < 120) {
        currentSection = "Home";
      } else {
        for (const section of sections) {
          const element = document.getElementById(section.id);
          if (element) {
            const rect = element.getBoundingClientRect();
            // Triggers active when section top crosses into the upper half of screen
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= 100) {
              currentSection = section.name;
            }
          }
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname, location.hash]);

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
          {linksToShow.map((item) => {
            const path = linkMap[item] || "/";
            
            // Core Logic Adjustment:
            // 1. If on home page, use the `activeSection` state strictly for landing tabs
            // 2. Otherwise, match paths traditionally
            const isActive = location.pathname === "/" && ["Home", "Features", "Platform"].includes(item)
              ? activeSection === item
              : location.pathname === path || location.pathname.startsWith(`${path}/`);

            return (
              <Link
                key={item}
                to={path}
                onClick={(e) => handleSectionScroll(e, path, item)}
                className={
                  isActive
                    ? "font-bold text-teal-600 transition-colors"
                    : "text-slate-500 hover:text-teal-600 transition-colors"
                }
              >
                {item}
              </Link>
            );
          })}
        </div>

        {/* right side */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <NotificationFeed userRole={role} />

              <div
                ref={profileMenuRef}
                className="relative"
                onMouseLeave={() => setIsOpen(false)}
              >
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
                  <div className="absolute right-0 top-full w-44 pt-2">
                    <div className="rounded-md border bg-white py-1 text-sm shadow-lg">
                      {isSuperadmin && (
                        <Link
                          to={linkMap.Organization}
                          className="block px-4 py-2 text-slate-700 hover:bg-slate-50"
                          onClick={() => setIsOpen(false)}
                        >
                          Organization
                        </Link>
                      )}

                      {isAdmin && (
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

                      {!isSuperadmin && (
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
                      )}

                      <button
                        onClick={handleLogoutClick}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-slate-50"
                      >
                        Logout
                      </button>
                    </div>
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