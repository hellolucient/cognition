"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/components/providers/supabase-provider";
import { AIProvider, getProviderDisplayName, getProviderDocsUrl } from "@/lib/ai-providers";
import Link from "next/link";

interface InviteCode {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  usedBy?: {
    name: string | null;
    email: string;
  };
}

interface PendingShare {
  id: string;
  url: string;
  title: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

export default function SettingsPage() {
  const { user } = useSupabase();
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  
  // Pending shares state
  const [pendingShares, setPendingShares] = useState<PendingShare[]>([]);
  const [pendingSharesLoading, setPendingSharesLoading] = useState(true);
  const [pendingSharesFilter, setPendingSharesFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  
  // API Key management
  const [apiKeyStatus, setApiKeyStatus] = useState({
    hasOpenAI: false,
    hasAnthropic: false,
    hasGoogle: false
  });
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState("");

  useEffect(() => {
    if (user) {
      fetchInviteCodes();
      checkApiKeyStatus();
      fetchPendingShares();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPendingShares();
    }
  }, [user, pendingSharesFilter]);

  const fetchInviteCodes = async () => {
    try {
      const response = await fetch('/api/user/invite-codes');
      const data = await response.json();
      
      if (response.ok) {
        setInviteCodes(data.codes);
      } else {
        setError(data.error || 'Failed to load invite codes');
      }
    } catch (error) {
      setError('Failed to load invite codes');
    } finally {
      setLoading(false);
    }
  };

  const generateNewCodes = async (count: number = 3) => {
    setGenerating(true);
    setError("");

    try {
      const response = await fetch('/api/invite/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchInviteCodes(); // Refresh the list
      } else {
        setError(data.error || 'Failed to generate codes');
      }
    } catch (error) {
      setError('Failed to generate codes');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (code: string, type: 'code' | 'link' = 'code') => {
    const textToCopy = type === 'code' ? code : getShareUrl(code);
    navigator.clipboard.writeText(textToCopy);
    
    // Show copied state
    const key = `${code}-${type}`;
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    
    // Reset after 2 seconds
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const getShareUrl = (code: string) => {
    return `${window.location.origin}?invite=${code}`;
  };

  const shareOnX = (code: string) => {
    const tweetText = `Join me on @cognition_ai - where AI conversations become collaborative knowledge! 🧠✨\n\nUse my invite code: ${code}\n\n#AI #Collaboration #Cognition`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank');
  };

  // Pending Shares Functions
  const fetchPendingShares = async () => {
    try {
      setPendingSharesLoading(true);
      const statusParam = pendingSharesFilter === 'all' ? '' : `?status=${pendingSharesFilter}`;
      const response = await fetch(`/api/pending-shares${statusParam}`);
      const data = await response.json();
      
      if (response.ok) {
        setPendingShares(data.pendingShares);
      } else {
        console.error('Failed to fetch pending shares:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch pending shares:', error);
    } finally {
      setPendingSharesLoading(false);
    }
  };

  const openChatGPT = (url: string) => {
    window.open(url, '_blank');
  };

  const markAsCompleted = async (shareId: string) => {
    try {
      const response = await fetch(`/api/pending-shares/${shareId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (response.ok) {
        await fetchPendingShares(); // Refresh the list
      } else {
        alert('Failed to mark as completed');
      }
    } catch (error) {
      alert('Failed to mark as completed');
    }
  };

  const deletePendingShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to delete this saved conversation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pending-shares/${shareId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPendingShares(); // Refresh the list
      } else {
        alert('Failed to delete pending share');
      }
    } catch (error) {
      alert('Failed to delete pending share');
    }
  };

  // API Key Management Functions
  const checkApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/user/api-key-status');
      const data = await response.json();
      
      if (response.ok) {
        setApiKeyStatus({
          hasOpenAI: data.hasOpenAI,
          hasAnthropic: data.hasAnthropic,
          hasGoogle: data.hasGoogle
        });
      }
    } catch (error) {
      console.error('Failed to check API key status:', error);
    }
  };

  const saveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setApiKeyError('Please enter an API key');
      return;
    }

    // Debug logging for mobile
    console.log('Settings page - Starting API key save:', {
      provider: selectedProvider,
      keyLength: apiKeyInput.length,
      keyPrefix: apiKeyInput.substring(0, 10) + '...',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    setSavingApiKey(true);
    setApiKeyError('');

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          apiKey: apiKeyInput,
          provider: selectedProvider
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the status for the specific provider
        setApiKeyStatus(prev => ({
          ...prev,
          [`has${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}`]: true
        } as any));
        setShowApiKeyInput(false);
        setApiKeyInput('');
        alert(`${getProviderDisplayName(selectedProvider)} API key saved successfully! You can now contribute to conversations with AI.`);
      } else {
        console.error('API key save failed:', { status: response.status, data });
        setApiKeyError(data.error || 'Failed to save API key');
      }
    } catch (error) {
      console.error('API key save error:', error);
      setApiKeyError(`Failed to save API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSavingApiKey(false);
    }
  };

  const removeApiKey = async (provider: AIProvider) => {
    if (!confirm(`Are you sure you want to remove your ${getProviderDisplayName(provider)} API key? You will no longer be able to contribute to conversations with ${getProviderDisplayName(provider)}.`)) {
      return;
    }

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      if (response.ok) {
        // Update the status for the specific provider
        setApiKeyStatus(prev => ({
          ...prev,
          [`has${provider.charAt(0).toUpperCase() + provider.slice(1)}`]: false
        } as any));
        alert(`${getProviderDisplayName(provider)} API key removed successfully.`);
      } else {
        alert('Failed to remove API key');
      }
    } catch (error) {
      alert('Failed to remove API key');
    }
  };

  if (!user) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access your settings.</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
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
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and invite codes
          </p>
        </div>

        {/* Save Links Section - Mobile Feature */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-green-800">📱 Save ChatGPT Share Links</h2>
              <p className="text-green-700 text-sm mt-1">
                For mobile users who can't use the bookmarklet
              </p>
            </div>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/save-for-later">
                🔗 Open Save Links
              </Link>
            </Button>
          </div>
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded border border-green-200">
            <p><strong>How it works:</strong></p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Copy ChatGPT share URLs on mobile</li>
              <li>Paste them here with optional notes</li>
              <li>Process them later on desktop with the bookmarklet</li>
            </ol>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-muted/30 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-2">
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Name:</strong> {user.user_metadata?.name || "Not set"}</div>
            <div><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* API Key Management */}
        <div className="bg-muted/30 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">AI Provider API Keys</h2>
          <p className="text-muted-foreground mb-4">
            Add your AI provider API keys to contribute to conversations with AI. Your keys are encrypted and stored securely.
          </p>
          
          {/* Provider Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* OpenAI */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={apiKeyStatus.hasOpenAI ? "text-green-600" : "text-gray-400"}>
                  {apiKeyStatus.hasOpenAI ? "✅" : "⚪"}
                </div>
                <div>
                  <div className="font-medium">OpenAI</div>
                  <div className="text-sm text-muted-foreground">
                    {apiKeyStatus.hasOpenAI ? "Configured" : "Not configured"}
                  </div>
                </div>
              </div>
              {apiKeyStatus.hasOpenAI && (
                <Button 
                  size="sm"
                  variant="outline" 
                  onClick={() => removeApiKey('openai')}
                  className="w-full"
                >
                  Remove Key
                </Button>
              )}
            </div>

            {/* Anthropic */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={apiKeyStatus.hasAnthropic ? "text-green-600" : "text-gray-400"}>
                  {apiKeyStatus.hasAnthropic ? "✅" : "⚪"}
                </div>
                <div>
                  <div className="font-medium">Anthropic</div>
                  <div className="text-sm text-muted-foreground">
                    {apiKeyStatus.hasAnthropic ? "Configured" : "Not configured"}
                  </div>
                </div>
              </div>
              {apiKeyStatus.hasAnthropic && (
                <Button 
                  size="sm"
                  variant="outline" 
                  onClick={() => removeApiKey('anthropic')}
                  className="w-full"
                >
                  Remove Key
                </Button>
              )}
            </div>

            {/* Google */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={apiKeyStatus.hasGoogle ? "text-green-600" : "text-gray-400"}>
                  {apiKeyStatus.hasGoogle ? "✅" : "⚪"}
                </div>
                <div>
                  <div className="font-medium">Google AI</div>
                  <div className="text-sm text-muted-foreground">
                    {apiKeyStatus.hasGoogle ? "Configured" : "Not configured"}
                  </div>
                </div>
              </div>
              {apiKeyStatus.hasGoogle && (
                <Button 
                  size="sm"
                  variant="outline" 
                  onClick={() => removeApiKey('google')}
                  className="w-full"
                >
                  Remove Key
                </Button>
              )}
            </div>
          </div>

          {/* Add/Update API Key Section */}
          {!showApiKeyInput ? (
            <div className="text-center">
              <Button onClick={() => setShowApiKeyInput(true)}>
                Add/Update API Key
              </Button>
            </div>
          ) : null}

          {showApiKeyInput && (
            <div className="mt-6 p-4 border rounded-lg bg-background">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider-select">AI Provider</Label>
                  <select
                    id="provider-select"
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google AI</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="api-key">{getProviderDisplayName(selectedProvider)} API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={selectedProvider === 'openai' ? 'sk-...' : selectedProvider === 'anthropic' ? 'sk-ant-...' : 'AI...'}
                    className="font-mono"
                  />
                  {apiKeyError && (
                    <div className="text-red-600 text-sm mt-1">{apiKeyError}</div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>• Your API key will be encrypted before storage</p>
                  <p>• Only you can use your API key for contributions</p>
                  <p>• Get your key from <a href={getProviderDocsUrl(selectedProvider)} target="_blank" className="underline">{getProviderDisplayName(selectedProvider)} Platform</a></p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={saveApiKey} 
                    disabled={savingApiKey}
                  >
                    {savingApiKey ? "Saving..." : "Save API Key"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowApiKeyInput(false);
                      setApiKeyInput('');
                      setApiKeyError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Saved Conversations (Pending Shares) */}
        <div className="bg-muted/30 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">📱 Saved Conversations</h2>
              <p className="text-muted-foreground">
                ChatGPT conversations saved from mobile for desktop processing
              </p>
            </div>
            <Button asChild>
              <Link href="/save-for-later">
                💾 Save New Chat
              </Link>
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={pendingSharesFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPendingSharesFilter('pending')}
            >
              Pending ({pendingShares.filter(s => s.status === 'pending').length})
            </Button>
            <Button
              variant={pendingSharesFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPendingSharesFilter('completed')}
            >
              Completed ({pendingShares.filter(s => s.status === 'completed').length})
            </Button>
            <Button
              variant={pendingSharesFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPendingSharesFilter('all')}
            >
              All ({pendingShares.length})
            </Button>
          </div>

          {/* Pending Shares List */}
          {pendingSharesLoading ? (
            <div className="text-center py-8">Loading saved conversations...</div>
          ) : pendingShares.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {pendingSharesFilter === 'pending' 
                  ? "No pending conversations. Save some from your mobile device!" 
                  : `No ${pendingSharesFilter} conversations found.`
                }
              </p>
              <Button asChild>
                <Link href="/save-for-later">
                  💾 Save Your First Chat
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingShares.map((share) => (
                <div key={share.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">
                          {share.title || 'Untitled ChatGPT Conversation'}
                        </h3>
                        <Badge 
                          variant={share.status === 'pending' ? 'default' : 'secondary'}
                        >
                          {share.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        Saved: {new Date(share.createdAt).toLocaleDateString()}
                        {share.completedAt && (
                          <span> • Completed: {new Date(share.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      
                      {share.notes && (
                        <div className="text-sm text-gray-600 mb-2">
                          📝 {share.notes}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground font-mono break-all">
                        {share.url}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openChatGPT(share.url)}
                      >
                        🔗 Open ChatGPT
                      </Button>
                      
                      {share.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsCompleted(share.id)}
                        >
                          ✅ Mark Complete
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePendingShare(share.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">💡 How to use:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Save ChatGPT conversations from your mobile device</li>
              <li>2. Click "Open ChatGPT" to view the conversation on desktop</li>
              <li>3. Use our bookmarklet to import the full conversation to Vanwinkle</li>
              <li>4. Mark as completed when done</li>
            </ol>
          </div>
        </div>

        {/* Invite Codes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Your Invite Codes</h2>
              <p className="text-muted-foreground">
                Share these codes with friends to invite them to Cognition
              </p>
            </div>
            <Button 
              onClick={() => generateNewCodes(3)} 
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate 3 More"}
            </Button>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading invite codes...</div>
          ) : inviteCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You don't have any invite codes yet.</p>
              <Button onClick={() => generateNewCodes(5)}>
                Generate Your First Codes
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {inviteCodes.map((invite) => (
                <div key={invite.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-lg font-semibold">
                        {invite.code}
                      </div>
                      <div className="flex gap-2">
                        {invite.usedAt ? (
                          <Badge variant="secondary">Used</Badge>
                        ) : (
                          <Badge variant="default">Available</Badge>
                        )}
                        {invite.expiresAt && new Date(invite.expiresAt) < new Date() && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>
                    </div>
                    
                    {!invite.usedAt && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(invite.code, 'code')}
                        >
                          {copiedStates[`${invite.code}-code`] ? '✅ Copied!' : 'Copy Code'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(invite.code, 'link')}
                        >
                          {copiedStates[`${invite.code}-link`] ? '✅ Copied!' : 'Copy Link'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareOnX(invite.code)}
                        >
                          🐦 Share on X
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div>Created: {new Date(invite.createdAt).toLocaleDateString()}</div>
                    {invite.usedAt && invite.usedBy && (
                      <div>
                        Used by: {invite.usedBy.name || invite.usedBy.email} on{' '}
                        {new Date(invite.usedAt).toLocaleDateString()}
                      </div>
                    )}
                    {invite.expiresAt && (
                      <div>Expires: {new Date(invite.expiresAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Invite Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {inviteCodes.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Codes</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {inviteCodes.filter(c => c.usedAt).length}
                </div>
                <div className="text-sm text-muted-foreground">Used</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {inviteCodes.filter(c => !c.usedAt && (!c.expiresAt || new Date(c.expiresAt) > new Date())).length}
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🔧 Troubleshooting</h2>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Having trouble saving API keys on mobile?</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p><strong>Try this:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to <Link href="/debug/api-key" className="underline text-blue-600">/debug/api-key</Link></li>
                <li>Test your API key there first</li>
                <li>If it works there but not here, it's a mobile browser issue</li>
              </ol>
              
              <p className="mt-3"><strong>Common fixes:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Clear browser cache and cookies</li>
                <li>Try in incognito/private mode</li>
                <li>Check if you're signed in properly</li>
                <li>Try a different mobile browser</li>
              </ul>
              
              <p className="mt-3"><strong>Device info:</strong></p>
              <div className="bg-white p-2 rounded text-xs font-mono">
                {typeof navigator !== 'undefined' ? navigator.userAgent : 'Loading...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}