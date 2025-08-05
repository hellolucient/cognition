"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setIsSuccess(true);
      setEmail("");
      setMessage("");

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError("");
    setEmail("");
    setMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {!isSuccess ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Join Cognition</h2>
              <p className="text-muted-foreground">
                We're building something special and scaling carefully. Join our waitlist to get early access!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
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
                <Label htmlFor="message">Tell us about yourself (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="What brings you to Cognition? What kind of AI conversations do you have?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? "Joining..." : "Join Waitlist"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
            <p className="text-muted-foreground mb-6">
              We're working hard to let more users in. Keep a close eye on your inbox and follow{" "}
              <a 
                href="https://twitter.com/cognition_ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                @cognition_ai
              </a>{" "}
              where we'll release invite codes!
            </p>
            <Button onClick={handleClose} className="w-full">
              Got it!
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}