/**
 * 🔔 useToast Hook - Manage toast notifications
 * @hook
 */
import { useState, useCallback } from 'react'

let toastId = 0

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ type = 'info', message, duration = 5000 }) => {
    const id = toastId++
    const newToast = { id, type, message, duration }
    
    setToasts(prev => [...prev, newToast])
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message, duration) => {
    return addToast({ type: 'success', message, duration })
  }, [addToast])

  const error = useCallback((message, duration) => {
    return addToast({ type: 'error', message, duration })
  }, [addToast])

  const warning = useCallback((message, duration) => {
    return addToast({ type: 'warning', message, duration })
  }, [addToast])

  const info = useCallback((message, duration) => {
    return addToast({ type: 'info', message, duration })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}

export default useToast
