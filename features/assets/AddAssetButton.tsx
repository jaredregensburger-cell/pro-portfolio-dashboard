'use client'

import { Button } from '@/components/ui'
import { useModalStore } from '@/store'
import { Plus } from 'lucide-react'

interface AddAssetButtonProps {
  label?: string
}

export function AddAssetButton({ label = 'Add Asset' }: AddAssetButtonProps) {
  const openModal = useModalStore((s) => s.openModal)

  return (
    <Button variant="primary" size="sm" onClick={() => openModal('add-asset')}>
      <Plus size={14} strokeWidth={2.5} />
      {label}
    </Button>
  )
}
