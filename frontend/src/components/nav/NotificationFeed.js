import React, { useEffect, useMemo, useRef, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import NotificationItem from "./NotificationItem";
import { useNotifications } from "./NotificationContext"; // Import our new hook

function NotificationFeed({ userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, removeNotification, clearNotifications } = useNotifications();
  const notificationRef = useRef(null);

  const filteredNotifications = useMemo(() => {
    if (userRole === "Superadmin") return notifications;
    return notifications.filter((n) => n.role === userRole);
  }, [notifications, userRole]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleClearAll = () => {
    const visibleIds = new Set(filteredNotifications.map((n) => n.id));
    clearNotifications(visibleIds);
  };

  return (
    <div ref={notificationRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-600"
      >
        <BellIcon className="h-6 w-6" />
        {filteredNotifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[1.2rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {filteredNotifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl z-50">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">
                {filteredNotifications.length > 0 ? `${filteredNotifications.length} new updates` : "All caught up"}
              </p>
            </div>
            {filteredNotifications.length > 0 && (
              <button onClick={handleClearAll} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  {...n}
                  onRead={() => removeNotification(n.id)}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-700">No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationFeed;