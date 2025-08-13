'use client'

import { Suspense, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSupabase } from "../providers/supabase-provider"
import { WaitlistModal } from "./waitlist-modal"
import { InviteSignupModal } from "./invite-signup-modal"
import { EmailSignInModal } from "./email-signin-modal"
import { useSearchParams, useRouter } from "next/navigation"

export default function SignInButton() {
  const { user, signOut } = useSupabase()
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [showInviteSignup, setShowInviteSignup] = useState(false)
  const [showEmailSignIn, setShowEmailSignIn] = useState(false)
  const [initialInviteCode, setInitialInviteCode] = useState<string | undefined>(undefined)
  const [initialInviteEmail, setInitialInviteEmail] = useState<string | undefined>(undefined)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    if (isSigningOut) return // Prevent double clicks
    
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
      // Reset loading state if sign out fails
      setIsSigningOut(false)
    }
    // Note: Don't reset isSigningOut on success, as the component will unmount
  }

  function InviteQueryListener() {
    const searchParams = useSearchParams()
    useEffect(() => {
      const invite = searchParams.get('invite') || undefined
      const email = searchParams.get('email') || undefined
      if (invite || email) {
        setInitialInviteCode(invite || undefined)
        setInitialInviteEmail(email || undefined)
        setShowInviteSignup(true)
        router.replace('/', { scroll: false })
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])
    return null
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 md:gap-4">
        <span className="text-sm text-muted-foreground hidden sm:block">
          Welcome, {user.user_metadata?.name ?? user.email?.split('@')[0]}!
        </span>
        <Button 
          variant="outline" 
          onClick={handleSignOut} 
          size="sm"
          disabled={isSigningOut}
          className="transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {isSigningOut ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
              Signing Out...
            </>
          ) : (
            'Sign Out'
          )}
        </Button>
      </div>
    )
  }

  return (
    <>
      <Suspense fallback={null}>
        <InviteQueryListener />
      </Suspense>
      <div className="flex items-center gap-1 md:gap-2">
        <Button onClick={() => setShowEmailSignIn(true)} variant="default" size="sm">
          Sign In
        </Button>
        <Button onClick={() => setShowInviteSignup(true)} variant="outline" size="sm" className="hidden md:flex">
          Have Invite Code?
        </Button>
        <Button onClick={() => setShowWaitlist(true)} size="sm" className="hidden lg:flex">
          Join Waitlist
        </Button>
      </div>
      
      <EmailSignInModal
        isOpen={showEmailSignIn}
        onClose={() => setShowEmailSignIn(false)}
      />
      
      <WaitlistModal 
        isOpen={showWaitlist} 
        onClose={() => setShowWaitlist(false)} 
      />
      
      <InviteSignupModal
        isOpen={showInviteSignup}
        onClose={() => setShowInviteSignup(false)}
        initialCode={initialInviteCode}
        initialEmail={initialInviteEmail}
      />
    </>
  )
}