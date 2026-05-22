import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import useAuthStore from "../../store/useAuthStore";

const NotificationContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const DEFAULT_POLL_MS = 8000;
const MAX_NOTIFICATIONS = 200;

const parsePollInterval = () => {
  const parsed = Number.parseInt(process.env.REACT_APP_NOTIFICATIONS_POLL_MS, 10);
  if (!Number.isFinite(parsed) || parsed < 2000) return DEFAULT_POLL_MS;
  return parsed;
};

const POLL_INTERVAL_MS = parsePollInterval();

const toTimestamp = (value) => {
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

const mergeNotifications = (base = [], incoming = []) => {
  const map = new Map();

  base.forEach((item) => {
    if (!item?.id) return;
    map.set(item.id, item);
  });

  incoming.forEach((item) => {
    if (!item?.id) return;
    const existing = map.get(item.id);
    map.set(item.id, existing ? { ...existing, ...item } : item);
  });

  return Array.from(map.values())
    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    .slice(0, MAX_NOTIFICATIONS);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const latestCreatedAtRef = useRef("");
  const token = useAuthStore((s) => s.token);
  const userOrgId = useAuthStore((s) => s.user?.orgId || null);
  const userRole = useAuthStore((s) => s.user?.role || s.role);

  const getAuthHeaders = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const syncLatestCreatedAt = useCallback((items) => {
    if (!Array.isArray(items) || !items.length) {
      latestCreatedAtRef.current = "";
      return;
    }

    const latest = items.reduce((max, item) => {
      if (!item?.createdAt) return max;
      return toTimestamp(item.createdAt) > toTimestamp(max) ? item.createdAt : max;
    }, "");

    latestCreatedAtRef.current = latest || "";
  }, []);

  const fetchNotifications = useCallback(
    async ({ incremental = false, roleOverride = null } = {}) => {
      const queryRole = roleOverride ?? userRole ?? "";
      const normalizedRole = String(queryRole || "").toLowerCase();
      const params = new URLSearchParams();
      if (queryRole) params.set("role", queryRole);
      if (normalizedRole !== "superadmin" && userOrgId) {
        params.set("orgId", userOrgId);
      }
      if (incremental && latestCreatedAtRef.current) {
        params.set("after", latestCreatedAtRef.current);
      }
      if (!incremental) {
        params.set("limit", String(MAX_NOTIFICATIONS));
      }

      const res = await fetch(`${API_URL}/notifications?${params.toString()}`, {
        headers: { ...getAuthHeaders() },
      });

      if (!res.ok) {
        throw new Error("Failed to load notifications");
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        // Backward compatibility if API is old shape.
        return { notifications: data, unreadCount: data.length };
      }

      return {
        notifications: Array.isArray(data?.notifications) ? data.notifications : [],
        unreadCount: Number.isFinite(Number(data?.unreadCount)) ? Number(data.unreadCount) : 0,
      };
    },
    [getAuthHeaders, userOrgId, userRole],
  );

  useEffect(() => {
    let mounted = true;
    latestCreatedAtRef.current = "";
    setNotifications([]);
    setUnreadCount(0);

    const loadInitial = async () => {
      try {
        const { notifications: loaded, unreadCount: latestUnread } = await fetchNotifications({
          incremental: false,
        });
        if (!mounted) return;
        setNotifications(loaded);
        setUnreadCount(latestUnread);
        syncLatestCreatedAt(loaded);
      } catch (error) {
        console.error(error);
      }
    };

    const pollForNew = async () => {
      try {
        const { notifications: loaded, unreadCount: latestUnread } = await fetchNotifications({
          incremental: Boolean(latestCreatedAtRef.current),
        });
        if (!mounted) return;

        if (loaded.length) {
          setNotifications((prev) => {
            const merged = mergeNotifications(prev, loaded);
            syncLatestCreatedAt(merged);
            return merged;
          });
        }

        setUnreadCount(latestUnread);
      } catch (error) {
        console.error(error);
      }
    };

    loadInitial();
    const timer = window.setInterval(pollForNew, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [fetchNotifications, syncLatestCreatedAt]);

  useEffect(() => {
    const normalizedRole = String(userRole || "").toLowerCase();
    if (normalizedRole !== "admin" || !userOrgId) return;

    fetch(`${API_URL}/subscription/org/${userOrgId}/latest`, {
      headers: { ...getAuthHeaders() },
    }).catch((error) => {
      console.warn("Failed to sync subscription due reminders:", error);
    });
  }, [getAuthHeaders, userOrgId, userRole]);

  // This function can be called from any component to trigger a notification
  const addNotification = useCallback(async (config) => {
    const { type, role, title, message } = config;

    const tempId = `temp-${Date.now()}`;
    const newNotification = {
      id: tempId,
      type: type || "account_created",
      role: role || userRole || "Admin",
      orgId: userOrgId || null,
      title,
      message,
      time: "Just now",
      createdAt: new Date().toISOString(),
      readAt: null,
      isRead: false,
    };

    setNotifications((prev) => {
      const merged = mergeNotifications([newNotification], prev);
      syncLatestCreatedAt(merged);
      return merged;
    });
    setUnreadCount((prev) => prev + 1);

    try {
      const res = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          type: type || "account_created",
          role: role || userRole || "Admin",
          orgId: userOrgId || null,
          title,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to persist notification");
      }

      const saved = await res.json();
      setNotifications((prev) => {
        const withoutTemp = prev.filter((item) => item.id !== tempId);
        const merged = mergeNotifications(withoutTemp, [saved]);
        syncLatestCreatedAt(merged);
        return merged;
      });
    } catch (error) {
      console.error(error);
      // Roll back optimistic unread increment when persist fails.
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, [getAuthHeaders, syncLatestCreatedAt, userOrgId, userRole]);

  const markNotificationsAsRead = useCallback(async (idsToMark) => {
    const ids = Array.isArray(idsToMark)
      ? idsToMark
      : Array.from(idsToMark || []);

    if (!ids.length) return;

    const idSet = new Set(ids);
    const nowIso = new Date().toISOString();

    setNotifications((prev) => {
      const next = prev.map((n) => {
        if (!idSet.has(n.id) || n.readAt) return n;
        return {
          ...n,
          readAt: nowIso,
          isRead: true,
        };
      });
      return next;
    });

    setUnreadCount((prev) => Math.max(0, prev - ids.length));

    try {
      const normalizedRole = String(userRole || "").toLowerCase();
      const res = await fetch(`${API_URL}/notifications/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ids,
          role: userRole || "",
          orgId: normalizedRole !== "superadmin" ? userOrgId || null : null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      const payload = await res.json();
      if (Number.isFinite(Number(payload?.unreadCount))) {
        setUnreadCount(Number(payload.unreadCount));
      }
    } catch (error) {
      console.error(error);
      // Re-sync from server if mark-read fails.
      try {
        const { notifications: loaded, unreadCount: latestUnread } = await fetchNotifications({
          incremental: false,
        });
        setNotifications(loaded);
        setUnreadCount(latestUnread);
        syncLatestCreatedAt(loaded);
      } catch (syncError) {
        console.error(syncError);
      }
    }
  }, [fetchNotifications, getAuthHeaders, syncLatestCreatedAt, userOrgId, userRole]);

  const removeNotification = async (id) => {
    let shouldDecrementUnread = false;
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.readAt) {
        shouldDecrementUnread = true;
      }
      const next = prev.filter((n) => n.id !== id);
      syncLatestCreatedAt(next);
      return next;
    });

    if (shouldDecrementUnread) {
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    try {
      await fetch(`${API_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const clearNotifications = async (idsToClear) => {
    const ids = Array.isArray(idsToClear)
      ? idsToClear
      : Array.from(idsToClear || []);
    const idSet = new Set(ids);

    let removedUnread = 0;
    setNotifications((prev) => {
      removedUnread = prev.reduce((count, n) => {
        if (!idSet.has(n.id)) return count;
        return n.readAt ? count : count + 1;
      }, 0);
      const next = prev.filter((n) => !idSet.has(n.id));
      syncLatestCreatedAt(next);
      return next;
    });

    if (removedUnread > 0) {
      setUnreadCount((count) => Math.max(0, count - removedUnread));
    }

    if (!ids.length) return;

    try {
      await fetch(`${API_URL}/notifications/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ids }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        removeNotification,
        clearNotifications,
        markNotificationsAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
