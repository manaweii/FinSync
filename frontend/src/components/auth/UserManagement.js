import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import { useNotifications } from "../nav/NotificationContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function UserManagement() {
  const navigate = useNavigate();
  const { user, role, token } = useAuthStore();
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // for editing
  const [editingUser, setEditingUser] = useState(null);

  const getAuthHeaders = () => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  // load users once
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/users?role=${role}&orgId=${user?.orgId}`, {
        method: "GET",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch users");
      }

      const data = await res.json();

      // normalize id field to `id` (accept _id from backend)
      const normalized = Array.isArray(data)
        ? data.map((u) => ({ ...u, id: u.id || u._id }))
        : [];

      setUsers(normalized);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  // open edit form
  function startEdit(user) {
    setEditingUser({ ...user }); // copy so we can change it
  }

  // handle typing in edit form
  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditingUser((prev) => ({ ...prev, [name]: value }));
  }

  // save edited user to backend
  async function saveEdit() {
    if (!editingUser) return;

    try {
      setLoading(true);
      const previousUser = users.find((u) => u.id === editingUser.id);
      const headers = { "Content-Type": "application/json", ...getAuthHeaders() };

      const res = await fetch(`${API_URL}/users/${editingUser.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(editingUser),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update user");
      }

      const updated = await res.json();
      const normalized = { ...updated, id: updated.id || updated._id };

      if (
        previousUser?.status !== "Disabled" &&
        normalized.status === "Disabled"
      ) {
        addNotification({
          type: "account_disabled",
          role: "Admin",
          title: "Security Alert: User Disabled",
          message: `The account for "${normalized.fullName || normalized.email || normalized.id}" has been disabled by an administrator.`,
        });
      }

      // update list in state
      setUsers((prev) => prev.map((u) => (u.id === normalized.id ? normalized : u)));
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not update user.");
    } finally {
      loadUsers();
      setLoading(false);
    }
  }

  // delete user from backend
  async function deleteUser(id) {
    if (!window.confirm("Delete this user?")) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete user");
      }

      // remove from state
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (editingUser && editingUser.id === id) {
        setEditingUser(null);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not delete user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500">Read, edit, and delete users from your backend.</p>
          </div>
          
          <button
            onClick={() => navigate("/create-user")}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition w-full md:w-auto"
          >
            <span className="text-lg leading-none">+</span>
            <span>Add User</span>
          </button>
        </div>

        {loading && <p className="text-xs text-slate-500 mb-4 animate-pulse">Loading users...</p>}
        {error && <p className="text-xs text-red-500 mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List Column */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Organization</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-50">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">{user.fullName}</span>
                            <span className="text-[10px] text-slate-400">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500 hidden md:table-cell">{user.orgName}</td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button className="text-blue-600 hover:text-blue-800 font-medium" onClick={() => startEdit(user)}>Edit</button>
                            <button className="text-red-600 hover:text-red-800 font-medium" onClick={() => deleteUser(user.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {!loading && users.length === 0 && !error && (
                <div className="p-10 text-center">
                  <p className="text-sm text-slate-500">No users found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Edit Side Panel */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Edit User
              </h2>

              {editingUser ? (
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveEdit(); }}>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-medium text-slate-500 uppercase tracking-tight">Full Name</label>
                    <input
                      name="fullName"
                      value={editingUser.fullName || ''}
                      onChange={handleEditChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-[11px] font-medium text-slate-500 uppercase tracking-tight">Email Address</label>
                    <input
                      name="email"
                      value={editingUser.email || ''}
                      onChange={handleEditChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5 text-[11px] font-medium text-slate-500 uppercase tracking-tight">Role</label>
                      <select
                        name="role"
                        value={editingUser.role || ''}
                        onChange={handleEditChange}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="Superadmin">Super Admin</option>
                        <option value="Admin">Admin</option>
                        <option value="User">User</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1.5 text-[11px] font-medium text-slate-500 uppercase tracking-tight">Status</label>
                      <select
                        name="status"
                        value={editingUser.status || 'Active'}
                        onChange={handleEditChange}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="Active">Active</option>
                        <option value="Disabled">Disabled</option>
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
                      onClick={() => setEditingUser(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
                  <p className="text-xs text-slate-400 px-4">Select a user from the list to modify their account details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
