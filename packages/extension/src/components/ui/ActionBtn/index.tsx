import { LucideIcon } from 'lucide-react'
import React from 'react'

import styles from './styles.module.css'

interface ActionBtnProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> {
  icon: LucideIcon
  label?: string
  active?: boolean
  danger?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export default function ActionBtn({
  icon: Icon,
  label,
  active = false,
  danger = false,
  onClick,
  className,
  ...props
}: ActionBtnProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onClick?.(e)
  }

  const classNames = [
    styles.action,
    !label && styles.actionIcon,
    active && styles.actionActive,
    danger && styles.actionDanger,
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type='button'
      className={classNames}
      onClick={handleClick}
      {...props}
    >
      <Icon size={14} strokeWidth={2} />
      {label && <span>{label}</span>}
    </button>
  )
}
