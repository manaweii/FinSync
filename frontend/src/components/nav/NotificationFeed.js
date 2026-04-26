import React, { useEffect, useMemo, useRef, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import NotificationItem from "./NotificationItem";

const seedNotifications = [
  {
    id: 1,
    type: "account_created",
    role: "Superadmin",
    title: "New User Registered",
    message: 'A new user "Jane Doe" has successfully created an account.',
    time: "2 mins ago",
  },
  {
    id: 2,
    type: "payment_update",
    role: "Admin",
    title: "Payment Action Required",
    message: 'Subscription for "TechCorp" needs a billing update.',
    time: "1 hour ago",
  },
  {
    id: 3,
    type: "account_disabled",
    role: "Admin",
    title: "Security Alert",
    message: 'Account "User_882" has been disabled.',
    time: "3 hours ago",
  },
];

function NotificationFeed({ userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(seedNotifications);
  const notificationRef = useRef(null);

  const filteredNotifications = useMemo(() => {
    if (userRole === "Superadmin") {
      return notifications;
    }

    return notifications.filter((notification) => notification.role === userRole);
  }, [notifications, userRole]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const removeNotification = (id) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  };

  const clearNotifications = () => {
    const visibleIds = new Set(filteredNotifications.map((notification) => notification.id));

    setNotifications((current) =>
      current.filter((notification) => !visibleIds.has(notification.id))
    );
  };

  return (
    <div ref={notificationRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-600"
        aria-label="Toggle notifications"
      >
        <BellIcon className="h-6 w-6" />
        {filteredNotifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[1.2rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {filteredNotifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">
                {filteredNotifications.length > 0
                  ? `${filteredNotifications.length} unread notification${filteredNotifications.length > 1 ? "s" : ""}`
                  : "You're all caught up"}
              </p>
            </div>
            {filteredNotifications.length > 0 && (
              <button
                type="button"
                onClick={clearNotifications}
                className="text-xs font-medium text-emerald-600 transition hover:text-emerald-700"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  type={notification.type}
                  title={notification.title}
                  message={notification.message}
                  time={notification.time}
                  onRead={() => removeNotification(notification.id)}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No new notifications
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Updates will appear here when there is activity on your account.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationFeed;
