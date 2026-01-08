import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import Button from '@/components/ui/Button'

import styles from './styles.module.css'

interface DialogProps {
  title: string
  description?: string
  children: React.ReactNode
  trigger?: React.ReactNode
  open?: boolean
  onClose?: () => void
  width?: number
}

export function Dialog({
  title,
  description,
  children,
  trigger,
  open,
  onClose,
  width = 400
}: DialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && onClose) {
      onClose()
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      )}
      <DialogPrimitive.Overlay className={styles.overlay} />
      <DialogPrimitive.Content style={{ width }} className={styles.content}>
        <div className={styles.header}>
          <div>
            <DialogPrimitive.Title className={styles.title}>
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className={styles.description}>
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close asChild>
            <Button asIcon={true} color='light' variant='solid' size='sm'>
              <X strokeWidth={1} size={18} />
            </Button>
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  )
}
