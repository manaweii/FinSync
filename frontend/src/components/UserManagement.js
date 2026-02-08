import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function UserManagement() {
  const navigate = useNavigate();
  const { user, role, token } = useAuthStore();
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
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          User Management
        </h1>
        <p className="text-sm text-slate-500 mb-4">
          Read, edit, and delete users from your backend.
        </p>

        <button
          onClick={() => navigate("/create-user")}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add User</span>
        </button>

        {loading && <p className="text-xs text-slate-500">Loading...</p>}
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        <div className="grid grid-cols-3 gap-6">
          {/* TABLE */}
          <div className="col-span-2 bg-white rounded-2xl shadow border border-slate-100">
            <div className="grid grid-cols-[2fr,2fr,1fr,1fr,80px] px-5 py-3 text-[11px] font-medium text-slate-500 border-b border-slate-100">
              <span>Name</span>
              <span>Organization</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="text-xs">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[2fr,2fr,1fr,1fr,80px] px-5 py-3 items-center border-b border-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-800">{user.fullName}</span>
                  </div>
                  <span className="text-slate-500">{user.orgName}</span>
                  <span className="text-slate-500">{user.email}</span>
                  <span className="text-slate-700">{user.role}</span>
                  <span className="text-slate-700">{user.status}</span>

                  <div className="flex justify-end gap-2 text-[11px]">
                    <button
                      className="text-sky-600 hover:text-sky-700"
                      onClick={() => startEdit(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {!loading && users.length === 0 && !error && (
                <p className="px-5 py-3 text-xs text-slate-500">
                  No users found.
                </p>
              )}
            </div>
          </div>

          {/* EDIT PANEL */}
          <div className="bg-white rounded-2xl shadow border border-slate-100 px-6 py-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Edit User</h2>

            {editingUser ? (
              <form
                className="space-y-3 text-xs"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
              >
                <div>
                  <label className="block mb-1 text-slate-600">Name</label>
                  <input
                    name="fullName"
                    value={editingUser.fullName || ''}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">Email</label>
                  <input
                    name="email"
                    value={editingUser.email || ''}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">Role</label>
                  <select
                    name="role"
                    value={editingUser.role || ''}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none"
                  >

                    <option value="Superadmin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">Status</label>
                  <select
                    name="status"
                    value={editingUser.status || 'Active'}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-sky-600 py-2 text-xs font-medium text-white hover:bg-sky-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-500">Click “Edit” on a user in the table to change their details.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
