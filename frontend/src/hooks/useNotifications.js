import { useState, useCallback } from 'react';

/**
 * Custom hook para manejar el estado de notificaciones
 * @returns {Object} - Estado y métodos para gestionar notificaciones
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      read: false,
      time: 'Ahora',
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Métodos de conveniencia para tipos comunes
  const addAppointmentReminder = useCallback((title, message) => {
    addNotification({
      type: 'appointment',
      title,
      message,
    });
  }, [addNotification]);

  const addVaccineReminder = useCallback((title, message) => {
    addNotification({
      type: 'vaccine',
      title,
      message,
    });
  }, [addNotification]);

  const addPrescriptionAlert = useCallback((title, message) => {
    addNotification({
      type: 'prescription',
      title,
      message,
    });
  }, [addNotification]);

  const addPromotion = useCallback((title, message) => {
    addNotification({
      type: 'promotion',
      title,
      message,
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    // Helpers
    addAppointmentReminder,
    addVaccineReminder,
    addPrescriptionAlert,
    addPromotion,
  };
}

export default useNotifications;
