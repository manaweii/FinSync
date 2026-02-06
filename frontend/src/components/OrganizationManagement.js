import React, { useEffect, useState } from "react";
import useAuthStore from "../store/useAuthStore";
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
      const res = await fetch(`${API_URL}/orgs`, { headers: { ...getAuthHeaders() } });
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
    setEditingOrg({ ...org });
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditingOrg((prev) => ({ ...prev, [name]: value }));
  }

  async function saveEdit() {
    if (!editingOrg) return;
    try {
      const res = await fetch(`${API_URL}/orgs/${editingOrg._id || editingOrg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(editingOrg),
      });
      if (!res.ok) throw new Error("Failed to update organization");
      const updated = await res.json();
      setOrgs((prev) => prev.map((o) => (o._id === updated._id || o.id === updated.id ? updated : o)));
      setEditingOrg(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not update organization");
    } finally {
      loadOrgs(); // refresh list to get latest data and handle any discrepancies
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
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Organization Management</h1>
        <p className="text-sm text-slate-500 mb-4">View and manage organizations.</p>

        <button
          onClick={() => navigate("/create-organization")}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Organization</span>
        </button>

        {loading && <p className="text-xs text-slate-500">Loading...</p>}
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl shadow border border-slate-100">
            <div className="grid grid-cols-[2fr,1fr,1fr,1fr,80px] px-5 py-3 text-[11px] font-medium text-slate-500 border-b border-slate-100">
              <span>Name</span>
              <span>Contact</span>
              <span>Plan</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="text-xs">
              {orgs.map((org, idx) => (
                <div key={org._id || org.id || idx} className="grid grid-cols-[2fr,1fr,1fr,1fr,80px] px-5 py-3 items-center border-b border-slate-50">
                  <div className="text-slate-800">{org.name}</div>
                  <div className="text-slate-500">{org.contactEmail || '—'}</div>
                  <div className="text-slate-700">{org.plan || 'Starter'}</div>
                  <div className="text-slate-700">{org.status}</div>
                  <div className="flex justify-end gap-2 text-[11px]">
                    <button className="text-sky-600 hover:text-sky-700" onClick={() => startEdit(org)}>Edit</button>
                    <button className="text-red-600 hover:text-red-700" onClick={() => deleteOrg(org._id || org.id)}>Delete</button>
                  </div>
                </div>
              ))}

              {!loading && orgs.length === 0 && !error && (
                <p className="px-5 py-3 text-xs text-slate-500">No organizations found.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow border border-slate-100 px-6 py-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Edit Organization</h2>
            {editingOrg ? (
              <form className="space-y-3 text-xs" onSubmit={(e) => { e.preventDefault(); saveEdit(); }}>
                <div>
                  <label className="block mb-1 text-slate-600">Name</label>
                  <input name="name" value={editingOrg.name} onChange={handleEditChange} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600">Contact Email</label>
                  <input name="contactEmail" value={editingOrg.contactEmail || ''} onChange={handleEditChange} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600">Plan</label>
                  <select name="plan" value={editingOrg.plan || 'Starter'} onChange={handleEditChange} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <option>Starter</option>
                    <option>Growth</option>
                    <option>Professional</option>
                    <option>Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">Status</label>
                  <select name="status" value={editingOrg.status || 'Active'} onChange={handleEditChange} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <option>Active</option>
                    <option>Disabled</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 rounded-lg bg-sky-600 py-2 text-xs font-medium text-white hover:bg-sky-700">Save</button>
                  <button type="button" className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50" onClick={() => setEditingOrg(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-500">Click “Edit” on an organization to change details.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
