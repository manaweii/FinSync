import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const CHECK_INTERVAL_MS = 60 * 1000;

function isDisabledStatus(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return ["disabled", "inactive", "deactivated", "blocked"].includes(normalized);
}

function hasDisabledFlag(user) {
  if (!user) return false;

  return (
    user.is_disabled === true ||
    user.isDisabled === true ||
    isDisabledStatus(user.status) ||
    isDisabledStatus(user.userStatus)
  );
}

export default function useDisabledSessionMonitor() {
  const navigate = useNavigate();
  const { token, user, isLoggedIn, clearAuth, setAuth } = useAuthStore();
  const logoutStartedRef = useRef(false);

  const logoutDisabledUser = useCallback(() => {
    if (logoutStartedRef.current) return;
    logoutStartedRef.current = true;

    clearAuth();
    localStorage.removeItem("auth-store");
    navigate("/Login", { replace: true, state: { reason: "account-disabled" } });
  }, [clearAuth, navigate]);

  const checkUserStatus = useCallback(async () => {
    if (!isLoggedIn || !token || logoutStartedRef.current) return;

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        logoutDisabledUser();
        return;
      }

      if (!response.ok) return;

      const data = await response.json();
      const latestUser = data.user || data;

      if (hasDisabledFlag(latestUser)) {
        logoutDisabledUser();
        return;
      }

      setAuth(token, latestUser);
    } catch (error) {
      // Keep the current session on transient network errors; the next poll will retry.
    }
  }, [isLoggedIn, logoutDisabledUser, setAuth, token]);

  useEffect(() => {
    logoutStartedRef.current = false;
  }, [token]);

  useEffect(() => {
    if (isLoggedIn && hasDisabledFlag(user)) {
      logoutDisabledUser();
    }
  }, [isLoggedIn, logoutDisabledUser, user]);

  useEffect(() => {
    if (!isLoggedIn || !token) return undefined;

    checkUserStatus();
    const intervalId = window.setInterval(checkUserStatus, CHECK_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkUserStatus();
      }
    };

    const handleFocus = () => {
      checkUserStatus();
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === "auth-store") {
        checkUserStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [checkUserStatus, isLoggedIn, token]);
}
