'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useSupabase } from '@/components/providers/supabase-provider';
import Link from 'next/link';

export default function SaveForLaterPage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const { user } = useSupabase();
  const router = useRouter();

  // Fetch pending count on load
  useEffect(() => {
    if (user) {
      fetchPendingCount();
    }
  }, [user]);

  // Auto-paste from clipboard on mobile if possible
  useEffect(() => {
    const tryAutoPaste = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const clipboardText = await navigator.clipboard.readText();
          if (clipboardText && (clipboardText.includes('chatgpt.com') || clipboardText.includes('chat.openai.com'))) {
            setUrl(clipboardText);
          }
        }
      } catch (err) {
        // Clipboard access not available or denied, that's fine
      }
    };

    // Only try auto-paste if URL is empty
    if (!url) {
      tryAutoPaste();
    }
  }, [url]);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/pending-shares/count');
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.pending);
      }
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        setUrl(clipboardText);
        setError('');
      } else {
        setError('Clipboard access not available. Please paste manually.');
      }
    } catch (err) {
      setError('Could not access clipboard. Please paste manually.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/pending-shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setUrl('');
        setTitle('');
        setNotes('');
        setPendingCount(prev => prev + 1);
        
        // Auto-redirect to settings after 2 seconds
        setTimeout(() => {
          router.push('/settings');
        }, 2000);
      } else {
        setError(data.error || 'Failed to save ChatGPT conversation');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-6">
              You need to sign in to save ChatGPT conversations for later.
            </p>
            <Link href="/">
              <Button className="w-full">
                Go to Home Page
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
                  <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📱 Save ChatGPT Share Links
            </h1>
            <p className="text-gray-600">
              Save ChatGPT share URLs from mobile → Process on desktop later
            </p>
          {pendingCount > 0 && (
            <div className="mt-4 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm">
              You have {pendingCount} conversation{pendingCount !== 1 ? 's' : ''} waiting
            </div>
          )}
        </div>

        {/* Success Message */}
        {message && (
          <Card className="p-4 mb-6 bg-green-50 border-green-200">
            <div className="text-green-800 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="font-medium">{message}</p>
              <p className="text-sm mt-2">Redirecting to your dashboard...</p>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="text-red-800 text-center">
              <div className="text-2xl mb-2">❌</div>
              <p>{error}</p>
            </div>
          </Card>
        )}

        {/* Main Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                ChatGPT Share URL *
              </label>
              <div className="space-y-3">
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://chatgpt.com/share/..."
                  required
                  className="text-base" // Better for mobile
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasteFromClipboard}
                  className="w-full"
                >
                  📋 Paste from Clipboard
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Copy the share link from ChatGPT and paste it here
              </p>
            </div>

            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title (Optional)
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Python debugging help"
                className="text-base"
              />
            </div>

            {/* Notes Input */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this conversation..."
                rows={3}
                className="text-base resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full text-lg py-3"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  💾 Save for Desktop
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Instructions */}
        <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">💡 How it works:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. In ChatGPT mobile: Share → Copy link</li>
            <li>2. Paste that share URL here and save</li>
            <li>3. On desktop: See notification → Click "Open ChatGPT"</li>
            <li>4. Use our bookmarklet to import the full conversation</li>
          </ol>
        </Card>

        {/* Navigation */}
        <div className="mt-8 text-center space-y-4">
          <Link href="/settings">
            <Button variant="outline" className="w-full">
              📋 View My Saved Conversations ({pendingCount})
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}