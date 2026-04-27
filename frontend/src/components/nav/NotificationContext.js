import React, { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // This function can be called from any component to trigger a notification
  const addNotification = useCallback((config) => {
    const { type, role, title, message } = config;
    
    const newNotification = {
      id: Date.now(), // Generate unique ID
      type,
      role,
      title,
      message,
      time: "Just now",
    };

    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearNotifications = (idsToClear) => {
    setNotifications((prev) => prev.filter((n) => !idsToClear.has(n.id)));
  };

  return (
    <NotificationContext.Provider 
      value={{ notifications, addNotification, removeNotification, clearNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);