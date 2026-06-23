/**
 * 🎨 Card Component - Modern card with hover effects
 * @component
 */
import React from 'react'
import './Card.css'

/**
 * Card Component
 * @param {object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {boolean} props.hoverable - Enable hover effects
 * @param {boolean} props.bordered - Show border
 * @param {string} props.className - Additional classes
 */
export const Card = ({
  children,
  hoverable = true,
  bordered = false,
  className = '',
  onClick,
  ...props
}) => {
  const classNames = [
    'card-modern',
    hoverable && 'card-hoverable',
    bordered && 'card-bordered',
    onClick && 'card-clickable',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classNames} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

/**
 * Card Header
 */
export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
)

/**
 * Card Body
 */
export const CardBody = ({ children, className = '', ...props }) => (
  <div className={`card-body ${className}`} {...props}>
    {children}
  </div>
)

/**
 * Card Footer
 */
export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`} {...props}>
    {children}
  </div>
)

export default Card
