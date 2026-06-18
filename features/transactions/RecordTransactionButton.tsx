'use client'

import { Button } from '@/components/ui'
import { useModalStore } from '@/store'
import { Plus } from 'lucide-react'

interface RecordTransactionButtonProps {
  label?: string
}

export function RecordTransactionButton({ label = 'Record' }: RecordTransactionButtonProps) {
  const openModal = useModalStore((s) => s.openModal)

  return (
    <Button variant="primary" size="sm" onClick={() => openModal('add-transaction')}>
      <Plus size={14} strokeWidth={2.5} />
      {label}
    </Button>
  )
}
