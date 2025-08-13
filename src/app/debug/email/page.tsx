"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function EmailDebugPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [userLookup, setUserLookup] = useState<any>(null);

  const handleResendEmail = async () => {
    if (!email.trim()) {
      alert("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/email-test');
      const data = await response.json();
      setConfig(data);
    } catch (error: any) {
      setConfig({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const lookupUser = async () => {
    if (!email.trim()) {
      alert("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      // Try simple check first (doesn't require service role key)
      const simpleResponse = await fetch('/api/debug/simple-user-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const simpleData = await simpleResponse.json();

      // Try full lookup if possible
      let fullData = null;
      try {
        const fullResponse = await fetch('/api/debug/user-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        fullData = await fullResponse.json();
      } catch (e) {
        // Full lookup failed, just use simple data
      }

      setUserLookup({
        simple: simpleData,
        full: fullData,
        combined: {
          ...simpleData,
          supabaseAuth: fullData?.user || null,
        }
      });
    } catch (error: any) {
      setUserLookup({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="outline" asChild className="mb-4">
            <Link href="/">← Back to Home</Link>
          </Button>
          <h1 className="text-3xl font-bold">Email Debug Tool</h1>
          <p className="text-muted-foreground">
            Debug email confirmation issues with Supabase
          </p>
        </div>

        {/* Configuration Check */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Check</CardTitle>
            <CardDescription>
              Check current Supabase and environment configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkConfig} disabled={loading}>
              {loading ? "Checking..." : "Check Configuration"}
            </Button>

            {config && (
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Lookup */}
        <Card>
          <CardHeader>
            <CardTitle>User Lookup</CardTitle>
            <CardDescription>
              Check if a user account exists and its confirmation status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={lookupUser} disabled={loading || !email.trim()}>
                {loading ? "Looking up..." : "Lookup User"}
              </Button>
              <Button onClick={handleResendEmail} disabled={loading || !email.trim()} variant="outline">
                {loading ? "Sending..." : "Resend Confirmation"}
              </Button>
            </div>

            {userLookup && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">User Lookup Result:</h4>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(userLookup, null, 2)}
                </pre>
              </div>
            )}

            {result && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Email Resend Result:</h4>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Common Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Common Issues & Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Check Supabase Dashboard</h4>
              <p className="text-sm text-muted-foreground">
                Go to Authentication → Settings and verify:
              </p>
              <ul className="text-sm text-muted-foreground ml-4 list-disc">
                <li>Email confirmations are enabled</li>
                <li>Site URL is set correctly</li>
                <li>SMTP provider is configured (or using default)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">2. Check Spam Folder</h4>
              <p className="text-sm text-muted-foreground">
                Confirmation emails often end up in spam/junk folders.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. Environment Variables</h4>
              <p className="text-sm text-muted-foreground">
                Ensure NEXT_PUBLIC_SITE_URL is set to your production domain.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">4. Email Provider Limits</h4>
              <p className="text-sm text-muted-foreground">
                Supabase's default email service has rate limits. For production, configure a custom SMTP provider.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
