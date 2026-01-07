/**
 * Modal for setting up a new PIN
 * Requires password confirmation before setting PIN
 * 3-step process: Password → PIN → Confirm PIN
 */

import { useState } from 'react'
import { KeyRound, Lock, Loader2 } from 'lucide-react'

import Button from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import Input from '@/components/ui/Input'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

type SetupStep = 'password' | 'pin' | 'confirm'

interface PinSetupModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (pin: string, password: string) => Promise<void>
}

export function PinSetupModal({
  open,
  onClose,
  onSuccess
}: PinSetupModalProps) {
  const [step, setStep] = useState<SetupStep>('password')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password) {
      setStep('pin')
      setError(null)
    }
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length === 6) {
      setStep('confirm')
      setError(null)
    }
  }

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    setIsSubmitting(true)
    try {
      await onSuccess(pin, password)
      handleClose()
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to setup PIN')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep('password')
    setPassword('')
    setPin('')
    setConfirmPin('')
    setError(null)
    onClose()
  }

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('pin')
      setConfirmPin('')
    } else if (step === 'pin') {
      setStep('password')
      setPin('')
    }
    setError(null)
  }

  const renderStep = () => {
    switch (step) {
      case 'password':
        return (
          <form onSubmit={handlePasswordSubmit} className={styles.form}>
            <Text size='2' color='light'>
              Confirm your password to continue
            </Text>
            <Input
              type='password'
              placeholder='Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            >
              <Lock size={16} />
            </Input>
            <Button type='submit' disabled={!password}>
              Continue
            </Button>
          </form>
        )

      case 'pin':
        return (
          <form onSubmit={handlePinSubmit} className={styles.form}>
            <Text size='2' color='light'>
              Enter a 6-digit PIN
            </Text>
            <Input
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              placeholder='000000'
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              autoFocus
              className={styles.pinInput}
            >
              <KeyRound size={16} />
            </Input>
            <div className={styles.actions}>
              <Button variant='ghost' onClick={handleBack}>
                Back
              </Button>
              <Button type='submit' disabled={pin.length !== 6}>
                Continue
              </Button>
            </div>
          </form>
        )

      case 'confirm':
        return (
          <form onSubmit={handleConfirmSubmit} className={styles.form}>
            <Text size='2' color='light'>
              Confirm your PIN
            </Text>
            <Input
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              placeholder='000000'
              value={confirmPin}
              onChange={(e) =>
                setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              autoFocus
              className={styles.pinInput}
            >
              <KeyRound size={16} />
            </Input>
            {error && (
              <Text size='2'>
                {error}
              </Text>
            )}
            <div className={styles.actions}>
              <Button
                variant='ghost'
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type='submit'
                disabled={confirmPin.length !== 6 || isSubmitting}
              >
                {isSubmitting && <Loader2 className={styles.spinner} />}
                {isSubmitting ? 'Setting up...' : 'Setup PIN'}
              </Button>
            </div>
          </form>
        )
    }
  }

  return (
    <Drawer
      open={open}
      title='Setup PIN'
      description='Create a 6-digit PIN to quickly unlock your vault'
      width={400}
      onClose={handleClose}
    >
      <div className={styles.container}>{renderStep()}</div>
    </Drawer>
  )
}
