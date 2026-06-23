/**
 * 🔔 Toast Notification Component
 * @component
 */
import React, { useEffect } from 'react'
import './Toast.css'

/**
 * Toast Component
 * @param {object} props
 * @param {'success'|'error'|'warning'|'info'} props.type - Toast type
 * @param {string} props.message - Toast message
 * @param {boolean} props.isOpen - Toast visibility
 * @param {function} props.onClose - Close handler
 * @param {number} props.duration - Auto-close duration (ms)
 */
export const Toast = ({
  type = 'info',
  message,
  isOpen = false,
  onClose,
  duration = 5000,
  className = ''
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div className={`toast toast-${type} ${className}`}>
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
    </div>
  )
}

/**
 * Toast Container - Use this to manage multiple toasts
 */
export const ToastContainer = ({ toasts = [], onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id || index}
          {...toast}
          isOpen={true}
          onClose={() => onRemove(toast.id || index)}
        />
      ))}
    </div>
  )
}

export default Toast
