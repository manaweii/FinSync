import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function CreateOrganization() {
  const [form, setForm] = useState({
    name: "",
    contactEmail: "",
    phone: "",
    plan: "Starter",
    status: "Active",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        name: form.name,
        contactEmail: form.contactEmail,
        phone: form.phone,
        plan: form.plan,
        status: form.status,
      };

      const res = await fetch(`${API_URL}/createorg`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Failed to create organization");
        return;
      }

      alert(data.message || "Organization created");
      navigate("/organizations");
    } catch (err) {
      console.error(err);
      alert(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-[0_32px_80px_rgba(15,23,42,0.18)] px-10 py-10">
          <h1 className="text-xl font-semibold text-center text-slate-900 mb-1">
            Create organization
          </h1>
          <p className="text-xs text-center text-slate-500 mb-7">
            Add a new organization to the system.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block mb-1 text-slate-700">
                Organization name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-700">Contact email</label>
              <input
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-700">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              />
            </div>

            {/* Plan select */}
            <div>
              <label className="block mb-1 text-slate-700">Plan</label>
              <select
                name="plan"
                value={form.plan}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs text-slate-900"
              >
                <option value="Starter">Starter</option>
                <option value="Growth">Growth</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            {/* Status select */}
            <div>
              <label className="block mb-1 text-slate-700">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs text-slate-900"
              >
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500 py-2 text-xs font-medium text-white"
              >
                {isLoading ? "Creating..." : "Create organization"}
              </button>
              <button
                type="button"
                className="w-full text-xs text-teal-600"
                onClick={() =>
                  setForm({
                    name: "",
                    contactEmail: "",
                    phone: "",
                    plan: "Starter",
                    status: "Active",
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
