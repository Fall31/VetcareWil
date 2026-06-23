/**
 * 🎨 Input Component - Modern form input
 * @component
 */
import React, { forwardRef } from 'react'
import './Input.css'

/**
 * Input Component
 * @param {object} props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {React.ReactNode} props.icon - Icon element
 * @param {boolean} props.fullWidth - Full width input
 */
export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon,
  fullWidth = false,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  const inputClasses = [
    'input-modern',
    icon && 'input-with-icon',
    error && 'input-error',
    fullWidth && 'input-full',
    className
  ].filter(Boolean).join(' ')

  const containerClasses = [
    'input-container',
    fullWidth && 'input-container-full'
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {label && (
        <label className="input-label">
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          {...props}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
    </div>
  )
})

Input.displayName = 'Input'

/**
 * Textarea Component
 */
export const Textarea = forwardRef(({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  rows = 4,
  ...props
}, ref) => {
  const textareaClasses = [
    'input-modern',
    'textarea-modern',
    error && 'input-error',
    fullWidth && 'input-full',
    className
  ].filter(Boolean).join(' ')

  const containerClasses = [
    'input-container',
    fullWidth && 'input-container-full'
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {label && (
        <label className="input-label">
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={textareaClasses}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
    </div>
  )
})

Textarea.displayName = 'Textarea'

export default Input
