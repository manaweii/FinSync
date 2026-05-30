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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMenuOpen(false);
    navigate("/Login");
  };

  const handleSectionScroll = (e, path, item) => {
    setIsMobileMenuOpen(false);
    if (item === "Home" && location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSection("Home");
      window.history.pushState(null, "", "/");
      return;
    }

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

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection(null);
      return;
    }

    if (location.hash === "#featureSection") setActiveSection("Features");
    else if (location.hash === "#platformSection") setActiveSection("Platform");
    else setActiveSection("Home");

    const handleScroll = () => {
      const sections = [
        { id: "featureSection", name: "Features" },
        { id: "platformSection", name: "Platform" },
      ];

      let currentSection = "Home";

      if (window.scrollY < 120) {
        currentSection = "Home";
      } else {
        for (const section of sections) {
          const element = document.getElementById(section.id);
          if (element) {
            const rect = element.getBoundingClientRect();
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
    // Outer wrap provides background styling and responsive horizontal padding
    <nav className="w-full bg-white/80 backdrop-blur shadow-sm sticky top-0 z-50 px-4 sm:px-8 lg:px-12">
      {/* Changing to max-w-7xl ensures the layout boundary matches standard desktop content setups. 
        If your content is tighter, adjust this class to 'max-w-6xl'.
      */}
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-4">
        
        {/* Left Side: Hamburger & Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile Hamburger Button */}
          {linksToShow.length > 0 && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-teal-600 focus:outline-none md:hidden"
              aria-label="Toggle Menu"
            >
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.83-4.828 4.83a1 1 0 0 1-1.414-1.414l4.829-4.83-4.829-4.83a1 1 0 0 1 1.414-1.414l4.828 4.83 4.829-4.83a1 1 0 0 1 1.414 1.414l-4.83 4.83 4.83 4.83z"/>
                ) : (
                  <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"/>
                )}
              </svg>
            </button>
          )}

          <Link to={logoPath} className="flex items-center">
            <img
              src="./FinSync.png"
              alt="FinSync Logo"
              className="h-10 w-auto object-contain" 
            />
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          {linksToShow.map((item) => {
            const path = linkMap[item] || "/";
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

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
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
                  className="flex items-center gap-2 rounded-full border border-slate-100 bg-white p-1 md:px-3 md:py-2 shadow-sm hover:border-slate-200 transition-all"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-white">
                    <Initials name={user?.fullName || "U"} />
                  </div>
                  {/* Text hidden on mobile layout: only initials circle badge is visible */}
                  <div className="hidden md:block text-left text-xs">
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
              className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-sm font-medium shadow-md hover:opacity-90"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Navigation Drawer */}
      {isMobileMenuOpen && linksToShow.length > 0 && (
        <div className="md:hidden border-t border-slate-100 py-3 bg-white space-y-1">
          {linksToShow.map((item) => {
            const path = linkMap[item] || "/";
            const isActive = location.pathname === path;

            return (
              <Link
                key={item}
                to={path}
                onClick={(e) => handleSectionScroll(e, path, item)}
                className={`block px-4 py-2.5 rounded-md text-base font-medium transition-colors ${
                  isActive
                    ? "bg-teal-50 text-teal-600 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-teal-600"
                }`}
              >
                {item}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export default Navbar;