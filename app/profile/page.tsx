'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ProfileRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Aspetta che la sessione si carichi

    if (session?.user?.username) {
      // Reindirizza al profilo specifico dell'utente
      router.replace(`/profile/${session.user.username}`)
    } else {
      // Se non loggato, reindirizza al login
      router.replace('/auth/signin')
    }
  }, [session, status, router])

  // Mostra loading durante il redirect
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
} 