import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      role: "user",

      setAuth: (token, user) => {
        set({
          token: token || null,
          user: user || null,
          isLoggedIn: Boolean(token),
          role: user?.role || "user",
        });
      },

      clearAuth: () => {
        set({ token: null, user: null, isLoggedIn: false, role: "user" });
      },
    }),
    {
      name: "auth-store", // key in localStorage
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        role: state.role,
      }),
    }
  )
);

export default useAuthStore;
