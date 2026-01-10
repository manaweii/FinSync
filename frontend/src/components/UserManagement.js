import React, { useState } from "react";

const INITIAL_USERS = [
  {
    id: 1,
    name: "Sarah Chen",
    initials: "SC",
    email: "sarah.chen@finsync.io",
    role: "Admin",
    status: "Active",
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    initials: "MR",
    email: "m.rodriguez@finsync.io",
    role: "Manager",
    status: "Active",
  },
  {
    id: 3,
    name: "Emma Thompson",
    initials: "ET",
    email: "emma.t@finsync.io",
    role: "Viewer",
    status: "Active",
  },
  {
    id: 4,
    name: "James Wilson",
    initials: "JW",
    email: "j.wilson@finsync.io",
    role: "Manager",
    status: "Active",
  },
  {
    id: 5,
    name: "Olivia Martinez",
    initials: "OM",
    email: "olivia.m@finsync.io",
    role: "Viewer",
    status: "Disabled",
  },
];

function UserManagement() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [search, setSearch] = useState("");

  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  const handleRowClick = (user) => {
    setSelectedUserId(user.id);
  };

  const handleDetailChange = (e) => {
    if (!selectedUser) return;
    const { name, value } = e.target;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              [name]: value,
            }
          : u
      )
    );
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setSelectedUserId(null);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              User Management
            </h1>
            <p className="text-sm text-slate-500">
              Create, edit, and manage access for your organization.
            </p>
          </div>

          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-sm font-medium shadow-md hover:opacity-90">
            + Add User
          </button>
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-3 gap-6">
          {/* TABLE CARD */}
          <div className="col-span-2 bg-white rounded-2xl shadow-[0_18px_40px_rgba(15,23,42,0.06)] border border-slate-100">
            {/* search bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-xs">
                    /
                  </span>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
              <button className="ml-3 h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 text-sm">
                =
              </button>
            </div>

            {/* table header */}
            <div className="grid grid-cols-[2fr,2fr,1fr,1fr,72px] px-5 py-3 text-[11px] font-medium text-slate-500 border-b border-slate-100">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {/* rows */}
            <div className="text-xs">
              {filteredUsers.map((user, index) => {
                const isSelected = user.id === selectedUserId;
                return (
                  <div
                    key={user.id}
                    className={`grid grid-cols-[2fr,2fr,1fr,1fr,72px] px-5 py-3 items-center cursor-pointer ${
                      isSelected ? "bg-sky-50" : "bg-white"
                    } ${
                      index !== filteredUsers.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                    onClick={() => handleRowClick(user)}
                  >
                    {/* name */}
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-sky-500 text-white text-[11px] font-semibold flex items-center justify-center">
                        {user.initials}
                      </div>
                      <span className="text-slate-800">{user.name}</span>
                    </div>

                    {/* email */}
                    <span className="text-slate-500">{user.email}</span>

                    {/* role badge */}
                    <span
                      className={`inline-flex justify-center rounded-full px-3 py-1 text-[10px] font-medium ${
                        user.role === "Admin"
                          ? "bg-fuchsia-50 text-fuchsia-700"
                          : user.role === "Manager"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {user.role}
                    </span>

                    {/* status badge */}
                    <span
                      className={`inline-flex justify-center rounded-full px-3 py-1 text-[10px] font-medium ${
                        user.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.status}
                    </span>

                    {/* actions */}
                    <div className="flex justify-end gap-3 text-slate-400 text-sm">
                      <button
                        type="button"
                        className="hover:text-slate-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(user);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserId(user.id);
                          handleDeleteUser();
                        }}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <input
                  className="w-12 h-7 rounded border border-slate-200 text-center text-[11px]"
                  defaultValue="5"
                />
              </div>
              <div className="flex items-center gap-4">
                <span>1–5 of 8</span>
                <button className="text-slate-400">{`<`}</button>
                <button className="text-slate-700">{`>`}</button>
              </div>
            </div>
          </div>

          {/* DETAILS CARD */}
          <div className="bg-white rounded-2xl shadow-[0_18px_40px_rgba(15,23,42,0.06)] border border-slate-100 px-6 py-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              User Details
            </h2>

            {selectedUser ? (
              <form className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 text-slate-600" htmlFor="name">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={selectedUser.name}
                    onChange={handleDetailChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={selectedUser.email}
                    onChange={handleDetailChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600" htmlFor="role">
                    Role
                  </label>
                  <input
                    id="role"
                    name="role"
                    type="text"
                    value={selectedUser.role}
                    onChange={handleDetailChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600" htmlFor="status">
                    Status
                  </label>
                  <input
                    id="status"
                    name="status"
                    type="text"
                    value={selectedUser.status}
                    onChange={handleDetailChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    className="flex-1 rounded-lg bg-sky-600 py-2 text-xs font-medium text-white hover:bg-sky-700"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    onClick={() => setSelectedUserId(null)}
                  >
                    Cancel
                  </button>
                </div>

                <button
                  type="button"
                  className="mt-3 w-full text-xs font-medium text-red-600 hover:text-red-700"
                  onClick={handleDeleteUser}
                >
                  Delete User
                </button>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500">
                <div className="mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 flex items-center justify-center text-sky-500 text-xl">
                  U
                </div>
                <p>Select a user from the table to view and edit their details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
