"use client";

// Notification provider component that displays error alerts and other notifications
// Uses Material-UI Snackbar for consistent UI

import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import { notificationService, NotificationData } from '../services/notificationService';

interface NotificationState extends NotificationData {
  open: boolean;
  id: number;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification: NotificationData) => {
      const id = Date.now() + Math.random();
      setNotifications(prev => [...prev, { ...notification, open: true, id }]);
    });

    return unsubscribe;
  }, []);

  const handleClose = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, open: false } : notif
      )
    );
    
    // Remove from state after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 300);
  };

  return (
    <>
      {children}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={notification.open}
          autoHideDuration={notification.duration}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.type as AlertColor}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};