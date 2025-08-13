'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSupabase } from '../providers/supabase-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface EmailSignInModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EmailSignInModal({ isOpen, onClose }: EmailSignInModalProps) {
  const { signInWithEmail, supabase } = useSupabase()
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [signInError, setSignInError] = useState('')

  // Tabs
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')

  // Always default to Sign In when modal opens
  useEffect(() => {
    if (isOpen) setActiveTab('signin')
  }, [isOpen])

  // Sign Up State (invite required)
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpInvite, setSignUpInvite] = useState('')
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpError, setSignUpError] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState('')

  // Invite request state (for users without a code)
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState('')
  const [requestError, setRequestError] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setSignInError('Email and password are required')
      return
    }

    setSignInLoading(true)
    setSignInError('')

    try {
      const { error } = await signInWithEmail(signInEmail.trim(), signInPassword)
      
      if (error) {
        // Normalize to a user-friendly default, with an additional hint for unconfirmed accounts
        let errorMessage = 'Invalid email or password. Please check your credentials.'
        const raw = (error.message || '').toLowerCase()
        if (raw.includes('email not confirmed') || raw.includes('confirm')) {
          errorMessage = 'Invalid email or password. If you recently signed up, please check your email and click the confirmation link before signing in.'
        }
        setSignInError(errorMessage)
      } else {
        // Success - close modal
        onClose()
        resetForms()
      }
    } catch (error: any) {
      setSignInError(error.message || 'An unexpected error occurred')
    } finally {
      setSignInLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword.trim() || !signUpInvite.trim()) {
      setSignUpError('Name, email, password, and invite code are required')
      return
    }

    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters')
      return
    }

    setSignUpLoading(true)
    setSignUpError('')
    setSignUpSuccess('')

    try {
      const response = await fetch('/api/auth/signup-with-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: signUpInvite.trim().toUpperCase(),
          email: signUpEmail.trim(),
          password: signUpPassword,
          name: signUpName.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      // Attempt auto sign-in; if email confirmation is required this will likely fail gracefully
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signUpEmail.trim(),
        password: signUpPassword,
      })

      if (signInError) {
        setSignUpSuccess('Account created! Please check your email and click the confirmation link before signing in.')
      } else {
        // If it did sign in, close and reset
        onClose()
        resetForms()
        return
      }
    } catch (err: any) {
      setSignUpError(err.message || 'An unexpected error occurred')
    } finally {
      setSignUpLoading(false)
    }
  }

  const handleRequestInvite = async () => {
    setRequestError('')
    setRequestSuccess('')

    if (!signUpEmail.trim()) {
      setRequestError('Please enter your email above to request an invite')
      return
    }

    setRequestLoading(true)
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signUpEmail.trim(),
          message: `Signup invite request. Name: ${signUpName.trim() || '(not provided)'}${signUpInvite ? ` | Entered code: ${signUpInvite}` : ''}`,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to request invite')
      }
      setRequestSuccess('Request submitted! We will email you when an invite is available.')
    } catch (err: any) {
      setRequestError(err.message || 'Failed to request invite')
    } finally {
      setRequestLoading(false)
    }
  }

  const resetForms = () => {
    // Sign In
    setSignInEmail('')
    setSignInPassword('')
    setSignInError('')
    setSignInLoading(false)
    
    // Sign Up
    setSignUpName('')
    setSignUpEmail('')
    setSignUpPassword('')
    setSignUpInvite('')
    setSignUpError('')
    setSignUpSuccess('')
    setSignUpLoading(false)
  }

  const handleClose = () => {
    resetForms()
    setActiveTab('signin')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
          <DialogHeader>
          <DialogTitle>Sign In to vanwinkle</DialogTitle>
          <DialogDescription className="sr-only">Enter your credentials to sign in or switch to the Sign Up tab to create an account with an invite code.</DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4 mt-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="your@email.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  disabled={signInLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  disabled={signInLoading}
                  required
                />
              </div>
              
              {signInError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <div>{signInError}</div>
                  <div className="mt-2 text-xs text-red-700">
                    No account?
                    <button
                      type="button"
                      className="underline ml-1"
                      onClick={() => {
                        setActiveTab('signup')
                        if (signInEmail) setSignUpEmail(signInEmail)
                      }}
                    >
                      Sign up here
                    </button>
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={signInLoading}
              >
                {signInLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4 mt-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your name"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  disabled={signUpLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  disabled={signUpLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password (minimum 6 characters)</Label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  disabled={signUpLoading}
                  minLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-invite">Invite Code</Label>
                <Input
                  id="signup-invite"
                  type="text"
                  placeholder="ABC12345"
                  value={signUpInvite}
                  onChange={(e) => setSignUpInvite(e.target.value.toUpperCase())}
                  maxLength={8}
                  disabled={signUpLoading}
                  required
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Don&apos;t have an invite code?
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={handleRequestInvite}
                  disabled={requestLoading}
                >
                  {requestLoading ? 'Requesting...' : 'Request an Invite'}
                </Button>
              </div>

              {signUpError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{signUpError}</div>
              )}

              {requestError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{requestError}</div>
              )}

              {requestSuccess && (
                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">{requestSuccess}</div>
              )}

              {signUpSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{signUpSuccess}</div>
              )}

              <Button type="submit" className="w-full" disabled={signUpLoading || !!requestSuccess}>
                {signUpLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
