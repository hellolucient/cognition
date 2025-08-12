'use client'

import { createClient } from '@/lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

type SupabaseContext = {
  user: User | null
  session: Session | null
  supabase: ReturnType<typeof createClient>
  signOut: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error?: any }>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session?.user) {
        // Try to hydrate name from our DB profile
        try {
          const res = await fetch('/api/user/profile')
          const data = await res.json()
          if (res.ok && data?.profile?.name) {
            const patched = { ...session.user, user_metadata: { ...(session.user.user_metadata || {}), name: data.profile.name } } as any
            setUser(patched)
          } else {
            setUser(session.user)
          }
        } catch {
          setUser(session.user)
        }
      } else {
        setUser(null)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        try {
          const res = await fetch('/api/user/profile')
          const data = await res.json()
          if (res.ok && data?.profile?.name) {
            const patched = { ...session.user, user_metadata: { ...(session.user.user_metadata || {}), name: data.profile.name } } as any
            setUser(patched)
          } else {
            setUser(session.user)
          }
        } catch {
          setUser(session.user)
        }
      } else {
        setUser(null)
      }
      router.refresh()

      // Ensure an app user row exists after OAuth sign-in
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await fetch('/api/auth/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          console.warn('Failed to ensure user record exists:', err)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const value = {
    session,
    user,
    supabase,
    signOut: async () => {
      await supabase.auth.signOut()
      router.push('/')
    },
    signInWithEmail: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    },
    
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}