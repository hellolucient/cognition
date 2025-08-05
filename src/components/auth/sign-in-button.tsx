'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSupabase } from "../providers/supabase-provider"
import { WaitlistModal } from "./waitlist-modal"
import { InviteSignupModal } from "./invite-signup-modal"

export default function SignInButton() {
  const { user, signInWithGithub, signOut } = useSupabase()
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [showInviteSignup, setShowInviteSignup] = useState(false)

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Welcome, {user.user_metadata?.name || user.email}!
        </span>
        <Button variant="outline" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button onClick={signInWithGithub} variant="outline">
          Sign in with GitHub
        </Button>
        <Button onClick={() => setShowInviteSignup(true)} variant="outline">
          Have Invite Code?
        </Button>
        <Button onClick={() => setShowWaitlist(true)}>
          Join Waitlist
        </Button>
      </div>
      
      <WaitlistModal 
        isOpen={showWaitlist} 
        onClose={() => setShowWaitlist(false)} 
      />
      
      <InviteSignupModal
        isOpen={showInviteSignup}
        onClose={() => setShowInviteSignup(false)}
      />
    </>
  )
}