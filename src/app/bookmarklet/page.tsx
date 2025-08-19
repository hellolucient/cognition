"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { WaitlistModal } from "@/components/auth/waitlist-modal";
import { InviteSignupModal } from "@/components/auth/invite-signup-modal";
import { EmailSignInModal } from "@/components/auth/email-signin-modal";

export default function BookmarkletLanding() {
  const { user, loading: authLoading } = useSupabase();
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showInviteSignup, setShowInviteSignup] = useState(false);
  const [showEmailSignIn, setShowEmailSignIn] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [platform, setPlatform] = useState<string>('');
  const [isLoadingClipboard, setIsLoadingClipboard] = useState(false);

  useEffect(() => {
    // Handle URL parameters and check for content
    const urlParams = new URLSearchParams(window.location.search);
    const passedPlatform = urlParams.get('platform');
    const passedContent = urlParams.get('content');
    const fromBookmarklet = urlParams.get('from') === 'bookmarklet';
    
    if (passedPlatform) {
      setPlatform(passedPlatform);
    }

    // Check for content from URL parameter or sessionStorage
    if (passedContent) {
      try {
        const decodedContent = decodeURIComponent(passedContent);
        sessionStorage.setItem('vanwinkle_chat', decodedContent);
        setHasContent(true);
        console.log('✅ Content loaded from URL parameter:', decodedContent.length, 'characters');
      } catch (error) {
        console.error('Failed to decode content from URL:', error);
        setHasContent(false);
      }
    } else {
      // Fallback: check sessionStorage
      const storedContent = sessionStorage.getItem('vanwinkle_chat');
      if (storedContent) {
        setHasContent(true);
      } else if (fromBookmarklet) {
        // If coming from bookmarklet but no content, prompt user to paste from clipboard
        setHasContent(false);
      }
    }
  }, []);

  const handlePasteFromClipboard = async () => {
    setIsLoadingClipboard(true);
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.length > 50) {
        sessionStorage.setItem('vanwinkle_chat', text);
        setHasContent(true);
        // If user is already signed in, redirect immediately
        if (user) {
          window.location.href = '/submit?from=bookmarklet';
        }
      } else {
        alert('No conversation content found in clipboard. Please copy your AI conversation first.');
      }
    } catch (error) {
      alert('Unable to access clipboard. Please make sure you copied your conversation first.');
    } finally {
      setIsLoadingClipboard(false);
    }
  };

  useEffect(() => {
    // If user is authenticated and we have content, redirect to submit page
    if (user && hasContent && !authLoading) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        window.location.href = '/submit?from=bookmarklet';
      }, 500);
    }
  }, [user, hasContent, authLoading]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <main className="container mx-auto max-w-2xl py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="text-6xl">💬</div>
          <h1 className="text-3xl font-bold">Preparing your conversation...</h1>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Checking your account</p>
          </div>
        </div>
      </main>
    );
  }

  // If user is authenticated, show preparing state
  if (user) {
    return (
      <main className="container mx-auto max-w-2xl py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="text-6xl">✨</div>
          <h1 className="text-3xl font-bold">Ready to submit!</h1>
          <p className="text-muted-foreground text-lg">
            Taking you to the submission page...
          </p>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Loading editor</span>
          </div>
        </div>
      </main>
    );
  }

  // Show sign-in options for unauthenticated users
  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Conversation Captured!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your AI conversation is ready to share with the vanwinkle community.
          </p>
        </div>

        {hasContent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-green-600 text-sm font-medium">
              ✅ Conversation successfully captured from {platform || 'your AI platform'}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <div className="text-amber-700 text-sm font-medium mb-3">
              📋 Conversation copied to clipboard
            </div>
            <Button 
              onClick={handlePasteFromClipboard}
              disabled={isLoadingClipboard}
              variant="outline"
              size="sm"
            >
              {isLoadingClipboard ? "Loading..." : "Paste from Clipboard"}
            </Button>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-3">Sign In to Continue</h2>
          <p className="text-blue-700 mb-6 text-lg">
            Sign in to submit your conversation and join our AI knowledge community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setShowEmailSignIn(true)} size="lg">
              Sign In
            </Button>
            <Button onClick={() => setShowInviteSignup(true)} variant="outline" size="lg">
              Have Invite Code?
            </Button>
            <Button onClick={() => setShowWaitlist(true)} variant="outline" size="lg">
              Join Waitlist
            </Button>
          </div>
        </div>

        <div className="bg-muted/30 p-6 rounded-lg">
          <h3 className="font-semibold mb-3">What happens next:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-green-600">1.</span>
              Sign in to your vanwinkle account
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">2.</span>
              Your conversation will be automatically loaded
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">3.</span>
              Add tags, review, and submit to the community
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">4.</span>
              Others can contribute and build upon your conversation
            </li>
          </ul>
        </div>

        <div className="text-center">
          <Link 
            href="/" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to vanwinkle
          </Link>
        </div>
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
      />
    </main>
  );
}
