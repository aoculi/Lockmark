import { useEffect, useRef, useState } from 'react'

import styles from './styles.module.css'

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  onComplete?: (pin: string) => void
  className?: string
  length?: number
}

export default function PinInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  onComplete,
  className = '',
  length = 6
}: PinInputProps) {
  const [pinDigits, setPinDigits] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Sync external value to internal state
  useEffect(() => {
    const digits = value
      .split('')
      .slice(0, length)
      .concat(Array(length).fill(''))
      .slice(0, length)
    setPinDigits(digits)
  }, [value, length])

  // Auto-focus first input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus()
    }
  }, [autoFocus])

  // Call onComplete when all digits are filled
  useEffect(() => {
    const pin = pinDigits.join('')
    if (pin.length === length && onComplete) {
      onComplete(pin)
    }
  }, [pinDigits, length, onComplete])

  const handleInputChange = (index: number, inputValue: string) => {
    // Only allow single digit
    const digit = inputValue.replace(/\D/g, '').slice(-1)

    const newDigits = [...pinDigits]
    newDigits[index] = digit
    setPinDigits(newDigits)

    // Update parent component
    const newPin = newDigits.join('')
    onChange(newPin)

    // Auto-focus next input if digit was entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
        // If current input is empty, focus previous and clear it
        const newDigits = [...pinDigits]
        newDigits[index - 1] = ''
        setPinDigits(newDigits)
        const newPin = newDigits.join('')
        onChange(newPin)
        inputRefs.current[index - 1]?.focus()
      } else if (pinDigits[index]) {
        // Clear current digit
        const newDigits = [...pinDigits]
        newDigits[index] = ''
        setPinDigits(newDigits)
        const newPin = newDigits.join('')
        onChange(newPin)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length)

    if (pastedData) {
      const newDigits = pastedData
        .split('')
        .concat(Array(length).fill(''))
        .slice(0, length)
      setPinDigits(newDigits)
      const newPin = newDigits.join('')
      onChange(newPin)

      // Focus last filled input or first empty
      const nextIndex = Math.min(pastedData.length, length - 1)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {pinDigits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type='password'
          inputMode='numeric'
          pattern='[0-9]'
          maxLength={1}
          value={digit}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          className={styles.pinDigit}
        />
      ))}
    </div>
  )
}
