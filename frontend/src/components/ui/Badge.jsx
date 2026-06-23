/**
 * 🎨 Badge Component - Modern badge/chip
 * @component
 */
import React from 'react'
import './Badge.css'

/**
 * Badge Component
 * @param {object} props
 * @param {'primary'|'secondary'|'success'|'error'|'warning'|'info'} props.variant - Badge color
 * @param {'sm'|'md'|'lg'} props.size - Badge size
 * @param {React.ReactNode} props.children - Badge content
 */
export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const classNames = [
    'badge-modern',
    `badge-${variant}`,
    `badge-${size}`,
    dot && 'badge-dot',
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={classNames} {...props}>
      {dot && <span className="badge-dot-indicator" />}
      {children}
    </span>
  )
}

/**
 * Avatar Component
 */
export const Avatar = ({
  src,
  alt = '',
  size = 'md',
  fallback,
  online = false,
  className = '',
  ...props
}) => {
  const classNames = [
    'avatar-modern',
    `avatar-${size}`,
    online && 'avatar-online',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classNames} {...props}>
      {src ? (
        <img src={src} alt={alt} className="avatar-image" />
      ) : (
        <div className="avatar-fallback">
          {fallback || alt.charAt(0).toUpperCase()}
        </div>
      )}
      {online && <span className="avatar-status" />}
    </div>
  )
}

export default Badge
