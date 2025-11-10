import React from "react";

import styles from "./styles.module.css";

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: "sm" | "md" | "lg";
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ size = "md", error, className, children, ...props }, ref) => {
    const selectClassName = `${styles.select} ${styles[size]} ${
      error ? styles.error : ""
    } ${className || ""}`.trim();

    return (
      <div className={styles.component}>
        <select ref={ref} {...props} className={selectClassName}>
          {children}
        </select>
        {error && <span className={styles.fieldError}>{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
