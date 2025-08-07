'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  const { signInWithEmail, signUpWithEmail } = useSupabase()
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [signInError, setSignInError] = useState('')

  // Sign Up State  
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpName, setSignUpName] = useState('')
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpError, setSignUpError] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState('')

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
        setSignInError(error.message || 'Failed to sign in')
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
    
    if (!signUpEmail.trim() || !signUpPassword.trim()) {
      setSignUpError('Email and password are required')
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
      const { error } = await signUpWithEmail(
        signUpEmail.trim(), 
        signUpPassword, 
        signUpName.trim() || undefined
      )
      
      if (error) {
        setSignUpError(error.message || 'Failed to create account')
      } else {
        // Try to create user in database
        try {
          const createUserResponse = await fetch('/api/auth/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          
          if (!createUserResponse.ok) {
            console.warn('Failed to create user in database, but auth signup succeeded')
          }
        } catch (createUserError) {
          console.warn('Error creating user in database:', createUserError)
        }
        
        setSignUpSuccess('Account created! Please check your email for verification.')
        // Don't close modal immediately - let user see success message
      }
    } catch (error: any) {
      setSignUpError(error.message || 'An unexpected error occurred')
    } finally {
      setSignUpLoading(false)
    }
  }

  const resetForms = () => {
    // Sign In
    setSignInEmail('')
    setSignInPassword('')
    setSignInError('')
    setSignInLoading(false)
    
    // Sign Up
    setSignUpEmail('')
    setSignUpPassword('')
    setSignUpName('')
    setSignUpError('')
    setSignUpSuccess('')
    setSignUpLoading(false)
  }

  const handleClose = () => {
    resetForms()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In to Vanwinkle</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="signin" className="w-full">
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
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  disabled={signInLoading}
                  required
                />
              </div>
              
              {signInError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {signInError}
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
                <Label htmlFor="signup-name">Name (Optional)</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your name"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  disabled={signUpLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  disabled={signUpLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  disabled={signUpLoading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>
              
              {signUpError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {signUpError}
                </div>
              )}
              
              {signUpSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  {signUpSuccess}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={signUpLoading}
              >
                {signUpLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Note: New accounts may need to be approved before full access
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
