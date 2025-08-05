"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";

interface Thread {
  id: string;
  content: string;
  summary: string;
  source: string | null;
  tags: string[];
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export default function ContributePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributionType, setContributionType] = useState<"ai" | "manual" | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [manualContribution, setManualContribution] = useState("");
  const [userApiKey, setUserApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referencedText, setReferencedText] = useState("");
  const [referencedSource, setReferencedSource] = useState("");
  const { user } = useSupabase();

  useEffect(() => {
    fetchThread();
    
    // Check for reference parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refText = urlParams.get('ref');
    const refSource = urlParams.get('source');
    
    if (refText && refSource) {
      setReferencedText(refText);
      setReferencedSource(refSource);
    }
  }, [resolvedParams.id]);

  const fetchThread = async () => {
    try {
      const response = await fetch(`/api/threads/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setThread(data);
      } else {
        setError('Thread not found');
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
      setError('Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("Please sign in to contribute to conversations.");
      return;
    }

    if (contributionType === "ai" && !userPrompt.trim()) {
      alert("Please enter a prompt for the AI.");
      return;
    }

    if (contributionType === "ai" && !userApiKey.trim()) {
      alert("Please enter your OpenAI API key.");
      return;
    }

    if (contributionType === "manual" && !manualContribution.trim()) {
      alert("Please enter your contribution.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: contributionType,
          parentThreadId: resolvedParams.id,
          userPrompt: contributionType === "ai" ? userPrompt : null,
          manualContent: contributionType === "manual" ? manualContribution : null,
          userApiKey: contributionType === "ai" ? userApiKey : null,
          referencedText: referencedText || null,
          referencedSource: referencedSource || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create contribution');
      }
      
      alert("Contribution added successfully! Redirecting to the thread...");
      
      // Redirect to the parent thread to see the contribution, with scroll parameter
      window.location.href = `/thread/${resolvedParams.id}?scroll=bottom`;
      
    } catch (error: any) {
      alert(`Error contributing: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <main className="container mx-auto max-w-2xl py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Sign In Required</h1>
          <p className="text-muted-foreground">You need to sign in to contribute to conversations.</p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center">Loading thread...</div>
      </main>
    );
  }

  if (error || !thread) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Thread Not Found</h1>
          <p className="text-muted-foreground">{error || 'This thread does not exist.'}</p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl py-8">
      <div className="space-y-6">
        {/* Back Navigation */}
        <div>
          <Button variant="outline" asChild>
            <Link href={`/thread/${thread.id}`}>← Back to Thread</Link>
          </Button>
        </div>

        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Contribute to Conversation</h1>
          <p className="text-muted-foreground">
            Add your own insights or continue the conversation with AI. Your contribution will be added to the thread with proper attribution.
          </p>
          
          {/* Reference Display */}
          {referencedText && referencedSource && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Replying to:</h3>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-muted-foreground mb-1">{referencedSource}:</div>
                <div className="text-sm italic">"{referencedText}"</div>
              </div>
            </div>
          )}
        </div>

        {/* Contribution Type Selection */}
        {!contributionType && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">How would you like to contribute?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="border rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setContributionType("ai")}
              >
                <div className="space-y-2">
                  <h3 className="font-medium">Continue with AI</h3>
                  <p className="text-sm text-muted-foreground">
                    Add a new prompt and get an AI response that continues the conversation. Requires your own OpenAI API key.
                  </p>
                </div>
              </div>
              <div 
                className="border rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setContributionType("manual")}
              >
                <div className="space-y-2">
                  <h3 className="font-medium">Add Your Thoughts</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your own insights, analysis, or follow-up questions about this conversation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Contribution Form */}
        {contributionType === "ai" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Continue with AI</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The AI will be given the full context of the original conversation before responding to your prompt.
                </p>
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="api-key">Your OpenAI API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="sk-..."
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your API key is used only for this request and is not stored.
                </p>
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="user-prompt">Your prompt for the AI</Label>
                <Textarea
                  id="user-prompt"
                  placeholder="Ask a follow-up question, request clarification, or take the conversation in a new direction..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  required
                  rows={4}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Generating..." : "Continue with AI"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setContributionType(null)}>
                Back
              </Button>
            </div>
          </form>
        )}

        {/* Manual Contribution Form */}
        {contributionType === "manual" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Add Your Thoughts</h2>
              <div className="grid w-full gap-2">
                <Label htmlFor="manual-contribution">Your contribution</Label>
                <Textarea
                  id="manual-contribution"
                  placeholder="Share your insights, analysis, follow-up questions, or additional context about this conversation..."
                  value={manualContribution}
                  onChange={(e) => setManualContribution(e.target.value)}
                  required
                  rows={8}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Posting..." : "Add Contribution"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setContributionType(null)}>
                Back
              </Button>
            </div>
          </form>
        )}

        {/* Original Thread Context - moved to bottom */}
        <div className="bg-muted/30 p-6 rounded-lg">
          <h2 className="font-medium mb-3">Original Conversation Summary</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {thread.author.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="text-sm text-muted-foreground">
                by {thread.author.name || "Anonymous"}
                {thread.source && (
                  <>
                    {" • "}
                    <Badge variant="secondary">{thread.source}</Badge>
                  </>
                )}
              </div>
            </div>
            <p className="text-foreground leading-relaxed">{thread.summary}</p>
            {thread.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {thread.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}