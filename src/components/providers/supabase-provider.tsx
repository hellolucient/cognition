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
  signInWithGithub: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error?: any }>
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error?: any }>
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
      setUser(session?.user ?? null)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      router.refresh()
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
    signInWithGithub: async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
    },
    signInWithEmail: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    },
    signUpWithEmail: async (email: string, password: string, name?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || null,
          },
        },
      })
      return { error }
    }
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