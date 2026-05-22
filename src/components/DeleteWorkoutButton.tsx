'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteWorkoutAction } from '@/app/workouts/actions'

interface Props {
  id: string
  date: string
}

export default function DeleteWorkoutButton({ id, date }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }
    
    setIsDeleting(true)
    try {
      await deleteWorkoutAction(id, date)
    } catch (err) {
      console.error('Failed to delete workout:', err)
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      disabled={isDeleting}
      onClick={handleDelete}
      className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg transition-colors disabled:opacity-50"
      title="삭제"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
