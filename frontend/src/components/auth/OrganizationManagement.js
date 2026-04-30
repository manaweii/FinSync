import React, { useEffect, useState } from "react";
import useAuthStore from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function OrganizationManagement() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingOrg, setEditingOrg] = useState(null);
  const token = useAuthStore((s) => s.token);

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  async function loadOrgs() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/orgs`, {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error("Failed to load organizations");
      const data = await res.json();
      setOrgs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not load organizations");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(org) {
    setEditingOrg({
      ...org,
      name: org.name || org.orgName || org.Orgname || "",
      contactEmail: org.contactEmail || org.BillingEmail || "",
      phone: org.phone || org.Orgphone || "",
    });
    // Scroll to form on mobile when editing starts
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditingOrg((prev) => ({ ...prev, [name]: value }));
  }

  async function saveEdit() {
    if (!editingOrg) return;
    try {
      const res = await fetch(
        `${API_URL}/orgs/${editingOrg._id || editingOrg.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(editingOrg),
        },
      );
      if (!res.ok) throw new Error("Failed to update organization");
      const updated = await res.json();
      setOrgs((prev) =>
        prev.map((o) =>
          o._id === updated._id || o.id === updated.id ? updated : o,
        ),
      );
      setEditingOrg(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not update organization");
    } finally {
      loadOrgs();
    }
  }

  async function deleteOrg(id) {
    if (!window.confirm("Delete this organization?")) return;
    try {
      const res = await fetch(`${API_URL}/orgs/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error("Failed to delete organization");
      setOrgs((prev) => prev.filter((o) => (o._id || o.id) !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not delete organization");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Organization Management
            </h1>
            <p className="text-sm text-slate-500">
              View and manage organizations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/subscription-logs")}
              className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <span>Payment Log</span>
            </button>
            <button
              onClick={() => navigate("/create-organization")}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
            >
              <span className="text-lg leading-none">+</span>
              <span>Add Organization</span>
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-xs text-slate-500 mb-4 animate-pulse">
            Loading data...
          </p>
        )}
        {error && (
          <p className="text-xs text-red-500 mb-4 bg-red-50 p-3 rounded-lg border border-red-100">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List Column */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Admin
                      </th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                        Contact
                      </th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-50">
                    {orgs.map((org, idx) => (
                      <tr
                        key={org._id || org.id || idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {org.fullName || org.fullName }
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {org.name || org.orgName || org.Orgname}
                        </td>
                        <td className="px-5 py-4 text-slate-500 hidden sm:table-cell">
                          {org.contactEmail || org.BillingEmail}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {org.plan || "Starter"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${org.status === "Active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {org.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              className="text-blue-600 hover:text-blue-800 font-medium"
                              onClick={() => startEdit(org)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800 font-medium"
                              onClick={() => deleteOrg(org._id || org.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!loading && orgs.length === 0 && !error && (
                <div className="p-10 text-center">
                  <p className="text-sm text-slate-500">
                    No organizations found.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Edit Column */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Edit Organization
              </h2>

              {editingOrg ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit();
                  }}
                >
                  <div>
                    <label className="block mb-1.5 text-[11px] font-medium text-slate-500 uppercase">
                      Admin
                    </label>
                    <input
                      name="name"
                      value={editingOrg.fullName}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-medium text-slate-500 uppercase">
                      Organization
                    </label>
                    <input
                      name="name"
                      value={editingOrg.orgName}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-medium text-slate-500 uppercase">
                      Contact Email
                    </label>
                    <input
                      name="contactEmail"
                      value={editingOrg.contactEmail || ""}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed outline-none transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5 text-[11px] font-medium text-slate-500 uppercase">
                        Plan
                      </label>
                      <select
                        name="plan"
                        value={editingOrg.plan || "Starter"}
                        onChange={handleEditChange}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                      >
                        <option>Starter</option>
                        <option>Growth</option>
                        <option>Professional</option>
                        <option>Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1.5 text-[11px] font-medium text-slate-500 uppercase">
                        Status
                      </label>
                      <select
                        name="status"
                        value={editingOrg.status || "Active"}
                        onChange={handleEditChange}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                      >
                        <option>Active</option>
                        <option>Disabled</option>
                        <option>Pending</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                      onClick={() => setEditingOrg(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                  <p className="text-xs text-slate-400 px-4">
                    Select an organization from the list to modify its details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
