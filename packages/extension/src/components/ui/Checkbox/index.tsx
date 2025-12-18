import React from 'react'

import styles from './styles.module.css'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = (props: CheckboxProps) => {
  return (
    <label className={styles.checkboxContainer}>
      <input type='checkbox' {...props} className={styles.checkbox} />
      <span className={styles.checkmark} />
    </label>
  )
}
