import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function CreateOrganization() {
  const [form, setForm] = useState({ name: "", contactEmail: "", phone: "", plan: "Starter" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/orgs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create org");
      }
      const created = await res.json();
      alert("Organization created");
      navigate("/organization");
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
          <h1 className="text-xl font-semibold text-center text-slate-900 mb-1">Create organization</h1>
          <p className="text-xs text-center text-slate-500 mb-7">Add a new organization to the system.</p>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block mb-1 text-slate-700">Organization name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block mb-1 text-slate-700">Contact email</label>
              <input name="contactEmail" value={form.contactEmail} onChange={handleChange} type="email" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block mb-1 text-slate-700">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
            </div>

            <div className="pt-2 space-y-3">
              <button type="submit" disabled={isLoading} className="w-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500 py-2 text-xs font-medium text-white">{isLoading ? 'Creating...' : 'Create organization'}</button>
              <button type="button" className="w-full text-xs text-teal-600" onClick={() => setForm({ name: "", contactEmail: "", phone: "", plan: "Starter" })}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
