import React from 'react'

import styles from './styles.module.css'

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  size?: 'sm' | 'md' | 'lg'
  error?: string
  children?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ size = 'md', error, className, children, ...props }, ref) => {
    const inputClassName = `${styles.input} ${styles[size]} ${
      error ? styles.error : ''
    } ${children ? styles.withContent : ''} ${className || ''}`.trim()

    return (
      <div className={styles.component}>
        {children && <div className={styles.content}>{children}</div>}
        <input ref={ref} {...props} className={inputClassName} />
        {error && <span className={styles.fieldError}>{error}</span>}
      </div>
    )
  }
)

export default Input
