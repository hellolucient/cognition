"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/components/providers/supabase-provider";

interface InviteSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteSignupModal({ isOpen, onClose, onSuccess }: InviteSignupModalProps) {
  const { supabase } = useSupabase();
  const [step, setStep] = useState<"code" | "signup" | "success">("code");
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [newInviteCodes, setNewInviteCodes] = useState<string[]>([]);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  const validateInviteCode = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid invite code');
      }

      setInviteInfo(data);
      setStep("signup");

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // First create the account via our API
      const response = await fetch('/api/auth/signup-with-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          email: email.trim(),
          password,
          name: name.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Try to sign in the user on the client side
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      console.log('Sign in attempt:', { signInData, signInError });

      if (signInError) {
        // If sign-in fails, it might be due to email confirmation requirement
        console.warn('Auto sign-in failed:', signInError.message);
        // Still show success but with a note about email confirmation
        setNewInviteCodes(data.inviteCodes);
        setStep("success");
        setError("Account created! You may need to check your email for confirmation before signing in.");
      } else {
        // Sign-in successful
        setNewInviteCodes(data.inviteCodes);
        setStep("success");
        setError(""); // Clear any previous errors
      }

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    
    // Show copied state
    setCopiedStates(prev => ({ ...prev, [code]: true }));
    
    // Reset after 2 seconds
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [code]: false }));
    }, 2000);
  };

  const handleClose = () => {
    setStep("code");
    setInviteCode("");
    setEmail("");
    setPassword("");
    setName("");
    setError("");
    setInviteInfo(null);
    setNewInviteCodes([]);
    setCopiedStates({});
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess?.();
    // No need to reload - user is already signed in via Supabase
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {step === "code" && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Enter Invite Code</h2>
              <p className="text-muted-foreground">
                Have an invite code? Enter it below to create your account.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <Input
                  id="invite-code"
                  placeholder="ABC12345"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={validateInviteCode}
                  disabled={isLoading || !inviteCode.trim()}
                  className="flex-1"
                >
                  {isLoading ? "Validating..." : "Continue"}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "signup" && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
              <div className="bg-green-50 p-3 rounded text-sm">
                ✅ Valid invite from <strong>{inviteInfo?.invitedBy}</strong>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleSignup}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                <Button variant="outline" onClick={() => setStep("code")}>
                  Back
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Welcome to Cognition!</h2>
            <p className="text-muted-foreground mb-4">
              Your account has been created successfully. You now have 5 invite codes to share with friends!
            </p>
            
            {error && (
              <div className="text-blue-600 text-sm bg-blue-50 p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="bg-muted p-4 rounded mb-6">
              <h3 className="font-medium mb-2">Your Invite Codes:</h3>
              <div className="grid grid-cols-1 gap-2 text-sm font-mono">
                {newInviteCodes.map((code, index) => (
                  <div key={index} className="bg-white p-2 rounded border flex items-center justify-between">
                    <span>{code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(code)}
                      className="text-xs"
                    >
                      {copiedStates[code] ? '✅ Copied!' : 'Copy'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  const tweetText = `Just joined @cognition_ai - a platform where AI conversations become collaborative knowledge! 🧠✨\n\nWant an invite? Use code: ${newInviteCodes[0]}\n\n#AI #Collaboration #Cognition`;
                  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
                  window.open(tweetUrl, '_blank');
                }}
                variant="outline"
                className="w-full"
              >
                🐦 Share Your First Code on X
              </Button>
              
              <Button onClick={handleSuccess} className="w-full">
                Start Exploring!
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}