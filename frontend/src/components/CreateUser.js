import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function CreateUser() {
  const [form, setForm] = useState({
    fullName: "",
    orgName: "",
    email: "",
    password: "",
    role: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgsError, setOrgsError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // load organizations for dropdown
  useEffect(() => {
    let mounted = true;
    const loadOrgs = async () => {
      try {
        setOrgsLoading(true);
        setOrgsError("");
        const res = await fetch(`${API_URL}/orgs`, {
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        });
        if (!res.ok) throw new Error("Failed to load organizations");
        const data = await res.json();
        if (!mounted) return;
        // data expected as array of { _id, name }
        setOrgs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (mounted) setOrgsError("Could not load organizations");
      } finally {
        if (mounted) setOrgsLoading(false);
      }
    };
    loadOrgs();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Map frontend fields to backend register payload
      const payload = {
        fullName: form.fullName,
        companyName: form.orgName,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg = data.message || "Something went wrong while creating the user";
        alert(msg);
        setIsLoading(false);
        return;
      }

      console.log("User created:", data);

      // If backend returned token (registered user), optionally store it
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Clear form and navigate to users list
      setForm({ fullName: "", orgName: "", email: "", password: "", role: "" });
      alert(data.message || "User created successfully");
      navigate("/users");
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-[0_32px_80px_rgba(15,23,42,0.18)] px-10 py-10">
          {/* top icon */}
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-teal-500 flex items-center justify-center text-white text-2xl">
              +
            </div>
          </div>

          {/* title */}
          <h1 className="text-xl font-semibold text-center text-slate-900 mb-1">
            Create new user
          </h1>
          <p className="text-xs text-center text-slate-500 mb-7">
            Add a new team member to your organization.
          </p>

          {/* form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* full name */}
            <div>
              <label className="block mb-1 text-slate-700" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter full name"
                value={form.fullName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                required
              />
            </div>

            {/* organization name (dropdown) */}
            <div>
              <label className="block mb-1 text-slate-700" htmlFor="orgName">
                Organization
              </label>
              {orgsLoading ? (
                <div className="text-xs text-slate-500">Loading organizations...</div>
              ) : orgsError ? (
                <div className="text-xs text-rose-500">{orgsError}</div>
              ) : (
                <div className="relative">
                  <select
                    id="orgName"
                    name="orgName"
                    value={form.orgName}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                    required
                  >
                    <option value="">Select organization</option>
                    {orgs.map((o) => (
                      <option key={o._id || o.id} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 text-[10px]">
                    ▼
                  </span>
                </div>
              )}
            </div>

            {/* email */}
            <div>
              <label className="block mb-1 text-slate-700" htmlFor="email">
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                required
              />
            </div>

            {/* password */}
            <div>
              <label className="block mb-1 text-slate-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                  required
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 text-[10px]">
                  ●●
                </span>
              </div>
            </div>

            {/* role */}
            <div>
              <label className="block mb-1 text-slate-700" htmlFor="role">
                Role
              </label>
              <div className="relative">
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                >
                  <option value="">Select role</option>
                  <option value="Superadmin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 text-[10px]">
                  ▼
                </span>
              </div>
            </div>

            {/* buttons */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500 py-2 text-xs font-medium text-white shadow-[0_18px_40px_rgba(45,212,191,0.55)] hover:opacity-95 disabled:opacity-60"
              >
                {isLoading ? "Creating..." : "Create user"}
              </button>

              <button
                type="button"
                className="w-full text-xs font-medium text-teal-600 hover:text-teal-700"
                onClick={() =>
                  setForm({
                    fullName: "",
                    orgName: "",
                    email: "",
                    password: "",
                    role: "",
                  })
                }
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateUser;
