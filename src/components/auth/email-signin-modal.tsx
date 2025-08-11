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
  const { signInWithEmail } = useSupabase()
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [signInError, setSignInError] = useState('')

  // Removed sign-up state: invite-only signup is handled elsewhere

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
        // Provide more helpful error messages
        let errorMessage = error.message || 'Failed to sign in'
        if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.'
        } else if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.'
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

  // Removed sign-up handler

  const resetForms = () => {
    // Sign In
    setSignInEmail('')
    setSignInPassword('')
    setSignInError('')
    setSignInLoading(false)
    
    // No sign-up state to reset
  }

  const handleClose = () => {
    resetForms()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In to vanwinkle</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
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
          
          {/* Sign-up removed: invite-only flow */}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
