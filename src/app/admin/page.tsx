"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// already imported above
import { useSupabase } from "@/components/providers/supabase-provider";
import Link from "next/link";

interface PlatformStatus {
  currentProvider: string;
  availableProviders: {
    openai: { available: boolean; model?: string };
    anthropic: { available: boolean; model?: string };
    google: { available: boolean; model?: string };
  };
}

export default function AdminPage() {
  const { user } = useSupabase();
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [waitlist, setWaitlist] = useState<{ id: string; email: string; message: string | null; createdAt: string; notified: boolean }[]>([]);
  const [waitlistTotal, setWaitlistTotal] = useState<number>(0);
  const [loadingWaitlist, setLoadingWaitlist] = useState<boolean>(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [generatedCodesByEntry, setGeneratedCodesByEntry] = useState<Record<string, string[]>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPlatformStatus();
      fetchWaitlist();
    }
  }, [user]);

  const fetchPlatformStatus = async () => {
    try {
      const response = await fetch('/api/admin/platform-status');
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
        setSelectedProvider(data.currentProvider);
      } else {
        console.error('Failed to fetch platform status:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch platform status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlist = async () => {
    setLoadingWaitlist(true);
    try {
      const res = await fetch('/api/admin/waitlist');
      const data = await res.json();
      if (res.ok) {
        setWaitlist(data.entries);
        setWaitlistTotal(data.total);
      }
    } catch (e) {
      console.error('Failed to fetch waitlist', e);
    } finally {
      setLoadingWaitlist(false);
    }
  };

  const generateInvitesForEntry = async (entryId: string) => {
    setInvitingId(entryId);
    try {
      const res = await fetch('/api/admin/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, count: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to generate invite');
        return;
      }
      // Save generated codes in local state for display
      setGeneratedCodesByEntry(prev => ({
        ...prev,
        [entryId]: (data.codes || []).map((c: any) => c.code),
      }));
      // Refresh row state to reflect notified flag
      await fetchWaitlist();
    } catch (e) {
      alert('Failed to generate invite');
    } finally {
      setInvitingId(null);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const updatePlatformProvider = async () => {
    if (!selectedProvider || selectedProvider === status?.currentProvider) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/admin/platform-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: selectedProvider }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(prev => prev ? { ...prev, currentProvider: selectedProvider } : null);
        alert(`Platform AI provider updated to ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} successfully!`);
      } else {
        alert(data.error || 'Failed to update platform provider');
        setSelectedProvider(status?.currentProvider || '');
      }
    } catch (error) {
      alert('Failed to update platform provider');
      setSelectedProvider(status?.currentProvider || '');
    } finally {
      setUpdating(false);
    }
  };

  const testProvider = async (provider: string) => {
    setTesting(provider);
    try {
      const response = await fetch('/api/admin/test-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} test successful!`);
      } else {
        alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} test failed: ${data.error}`);
      }
    } catch (error) {
      alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} test failed`);
    } finally {
      setTesting(null);
    }
  };

  // Simple admin check - you can make this more sophisticated
  const isAdmin = user?.email === 'trent.munday@gmail.com'; // Update this with your email

  if (!user) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access the admin panel.</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don&apos;t have permission to access the admin panel.</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center">Loading admin panel...</div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Button variant="outline" asChild className="mb-4">
            <Link href="/">← Back to Feed</Link>
          </Button>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage platform AI providers and settings
          </p>
        </div>

        {/* Platform AI Provider */}
        <Card>
          <CardHeader>
            <CardTitle>Platform AI Provider</CardTitle>
            <CardDescription>
              Select which AI provider to use for generating summaries and titles for new posts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center gap-4">
              <span className="font-medium">Current Provider:</span>
              <Badge variant="default" className="text-lg px-3 py-1">
                {status?.currentProvider?.charAt(0).toUpperCase() + status?.currentProvider?.slice(1)}
              </Badge>
            </div>

            {/* Provider Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* OpenAI */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">OpenAI</h3>
                    <Badge variant={status?.availableProviders.openai.available ? "default" : "secondary"}>
                      {status?.availableProviders.openai.available ? "Available" : "No Key"}
                    </Badge>
                  </div>
                  {status?.availableProviders.openai.available && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Model: {status.availableProviders.openai.model}
                    </p>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => testProvider('openai')}
                    disabled={!status?.availableProviders.openai.available || testing === 'openai'}
                    className="w-full"
                  >
                    {testing === 'openai' ? 'Testing...' : 'Test'}
                  </Button>
                </div>

                {/* Anthropic */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Anthropic</h3>
                    <Badge variant={status?.availableProviders.anthropic.available ? "default" : "secondary"}>
                      {status?.availableProviders.anthropic.available ? "Available" : "No Key"}
                    </Badge>
                  </div>
                  {status?.availableProviders.anthropic.available && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Model: {status.availableProviders.anthropic.model}
                    </p>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => testProvider('anthropic')}
                    disabled={!status?.availableProviders.anthropic.available || testing === 'anthropic'}
                    className="w-full"
                  >
                    {testing === 'anthropic' ? 'Testing...' : 'Test'}
                  </Button>
                </div>

                {/* Google */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Google AI</h3>
                    <Badge variant={status?.availableProviders.google.available ? "default" : "secondary"}>
                      {status?.availableProviders.google.available ? "Available" : "No Key"}
                    </Badge>
                  </div>
                  {status?.availableProviders.google.available && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Model: {status.availableProviders.google.model}
                    </p>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => testProvider('google')}
                    disabled={!status?.availableProviders.google.available || testing === 'google'}
                    className="w-full"
                  >
                    {testing === 'google' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </div>

              {/* Provider Selection */}
              <div className="flex items-center gap-4">
                <span className="font-medium">Switch to:</span>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai" disabled={!status?.availableProviders.openai.available}>
                      OpenAI {!status?.availableProviders.openai.available && "(No Key)"}
                    </SelectItem>
                    <SelectItem value="anthropic" disabled={!status?.availableProviders.anthropic.available}>
                      Anthropic {!status?.availableProviders.anthropic.available && "(No Key)"}
                    </SelectItem>
                    <SelectItem value="google" disabled={!status?.availableProviders.google.available}>
                      Google AI {!status?.availableProviders.google.available && "(No Key)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={updatePlatformProvider}
                  disabled={updating || selectedProvider === status?.currentProvider || !selectedProvider}
                >
                  {updating ? "Updating..." : "Update Provider"}
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This affects summary and title generation for new posts. 
                User contributions will still use their own API keys and can choose any provider.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Waitlist Management */}
        <Card>
          <CardHeader>
            <CardTitle>Waitlist</CardTitle>
            <CardDescription>Approve requests and generate invite codes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Total entries: {waitlistTotal}</div>
              <Button variant="outline" size="sm" onClick={fetchWaitlist} disabled={loadingWaitlist}>
                {loadingWaitlist ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            <div className="divide-y border rounded-md">
              {waitlist.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No waitlist entries</div>
              )}
              {waitlist.map((w) => {
                const generated = generatedCodesByEntry[w.id] || [];
                const first = generated[0];
                const mailto = first
                  ? `mailto:${encodeURIComponent(w.email)}?subject=${encodeURIComponent('Your Cognition Invite Code')}&body=${encodeURIComponent(`Hi\n\nHere is your Cognition invite code: ${first}\n\nUse it on the Sign Up tab at ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'} .\n\nEnjoy!`)}`
                  : undefined;
                return (
                  <div key={w.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-4 justify-between">
                      <div>
                        <div className="font-medium">{w.email}</div>
                        <div className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleString()} {w.notified ? '• Notified' : ''}</div>
                        {w.message && <div className="text-sm mt-1 max-w-xl whitespace-pre-wrap">{w.message}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => generateInvitesForEntry(w.id)}
                          disabled={invitingId === w.id}
                        >
                          {invitingId === w.id ? 'Generating...' : 'Generate Invite'}
                        </Button>
                      </div>
                    </div>
                    {generated.length > 0 && (
                      <div className="bg-muted rounded p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {generated.map((code) => (
                            <div key={code} className="bg-white border rounded px-2 py-1 text-sm flex items-center gap-2">
                              <span className="font-mono">{code}</span>
                              <Button size="sm" variant="ghost" onClick={() => copyCode(code)}>
                                {copied === code ? 'Copied' : 'Copy'}
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {mailto && (
                            <a href={mailto} className="text-sm underline">Compose Email</a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}