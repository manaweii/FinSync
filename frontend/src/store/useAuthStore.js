import { create } from "zustand";

const useAuthStore = create((set, get) => ({
  // In-memory state only (no localStorage)
  token: null,
  user: null,
  isLoggedIn: false,
  role: 'user',
  orgId: null,

  setAuth: (token, user) => {
    // set in-memory state only
    set({ token: token || null, user: user || null, isLoggedIn: Boolean(token), role: (user?.role || 'user'), orgId: (user?.orgId || null) });
  },

  clearAuth: () => {
    set({ token: null, user: null, isLoggedIn: false, role: 'user', orgId: null });
  }
}));

export default useAuthStore;
