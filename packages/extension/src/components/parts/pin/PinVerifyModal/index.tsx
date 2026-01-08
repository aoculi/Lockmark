/**
 * Modal for verifying PIN to disable PIN unlock
 */

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import Button from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import PinInput from '@/components/ui/PinInput'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

interface PinVerifyModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (pin: string) => Promise<void>
}

export function PinVerifyModal({
  open,
  onClose,
  onSuccess
}: PinVerifyModalProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleComplete = async (completedPin: string) => {
    if (isVerifying) return

    setIsVerifying(true)
    setError(null)

    try {
      await onSuccess(completedPin)
      handleClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setPin('')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleClose = () => {
    setPin('')
    setError(null)
    setIsVerifying(false)
    onClose()
  }

  const handleChange = (newPin: string) => {
    setPin(newPin)
    if (error) setError(null)
  }

  return (
    <Dialog
      open={open}
      title='Verify PIN'
      description='Enter your PIN to disable PIN unlock'
      width={400}
      onClose={handleClose}
    >
      <div className={styles.form}>
        <PinInput
          value={pin}
          onChange={handleChange}
          onComplete={handleComplete}
          disabled={isVerifying}
          autoFocus
        />

        {error && (
          <div className={styles.error}>
            <Text size='2'>{error}</Text>
          </div>
        )}

        <div className={styles.actions}>
          <Button
            variant='ghost'
            onClick={handleClose}
            disabled={isVerifying}
            type='button'
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (pin.length === 6) {
                handleComplete(pin)
              }
            }}
            disabled={pin.length !== 6 || isVerifying}
          >
            {isVerifying && <Loader2 className={styles.spinner} />}
            {isVerifying ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
