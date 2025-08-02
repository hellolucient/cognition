'use client'

import { Button } from "@/components/ui/button"
import { useSupabase } from "../providers/supabase-provider"

export default function SignInButton() {
  const { user, signInWithGithub, signOut } = useSupabase()

  return user ? (
    <Button variant="outline" onClick={signOut}>
      Sign Out
    </Button>
  ) : (
    <Button onClick={signInWithGithub}>
      Sign in with GitHub
    </Button>
  )
}