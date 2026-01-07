/**
 * Modal for entering PIN to unlock vault
 * Shows after auto-lock when PIN unlock is enabled
 */

import { useEffect, useState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'

import Button from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import Input from '@/components/ui/Input'
import Text from '@/components/ui/Text'
import { useQueryPin } from '@/components/hooks/queries/useQueryPin'
import { PIN_FAILED_ATTEMPTS_THRESHOLD } from '@/lib/pin'

import styles from './styles.module.css'

interface PinEntryModalProps {
  open: boolean
  onSuccess: () => void
  onPasswordLogin: () => void
}

export function PinEntryModal({
  open,
  onSuccess,
  onPasswordLogin
}: PinEntryModalProps) {
  const [pin, setPin] = useState('')
  const { unlockWithPin, phase, lockState } = useQueryPin()

  useEffect(() => {
    if (unlockWithPin.isSuccess) {
      onSuccess()
    }
  }, [unlockWithPin.isSuccess, onSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length === 6) {
      await unlockWithPin.mutateAsync(pin)
      if (!unlockWithPin.isError) {
        setPin('')
      }
    }
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPin(value)
  }

  const remainingAttempts = lockState
    ? PIN_FAILED_ATTEMPTS_THRESHOLD - lockState.failedPinAttempts
    : PIN_FAILED_ATTEMPTS_THRESHOLD

  const isLocked = lockState?.isHardLocked

  return (
    <Drawer
      open={open}
      title='Enter PIN'
      description='Enter your 6-digit PIN to unlock'
      width={400}
      onClose={() => {}} // Prevent closing
    >
      <div className={styles.container}>
        {isLocked ? (
          <div className={styles.lockedMessage}>
            <Text size='2'>
              Too many failed attempts. Please login with your password.
            </Text>
            <Button onClick={onPasswordLogin} className={styles.button}>
              Login with Password
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              placeholder='000000'
              value={pin}
              onChange={handlePinChange}
              disabled={unlockWithPin.isPending}
              autoFocus
              className={styles.pinInput}
            >
              <KeyRound size={16} />
            </Input>

            {unlockWithPin.isError && (
              <Text size='2'>
                Invalid PIN. {remainingAttempts} attempt
                {remainingAttempts !== 1 ? 's' : ''} remaining.
              </Text>
            )}

            <Button
              type='submit'
              disabled={pin.length !== 6 || unlockWithPin.isPending}
              className={styles.button}
            >
              {unlockWithPin.isPending && (
                <Loader2 className={styles.spinner} />
              )}
              {phase === 'verifying'
                ? 'Verifying...'
                : phase === 'loading'
                  ? 'Unlocking...'
                  : 'Unlock'}
            </Button>

            <Button
              variant='ghost'
              onClick={onPasswordLogin}
              disabled={unlockWithPin.isPending}
            >
              Use password instead
            </Button>
          </form>
        )}
      </div>
    </Drawer>
  )
}
