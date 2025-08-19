"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { WaitlistModal } from "@/components/auth/waitlist-modal";
import { TypingLoader } from "@/components/ui/typing-loader";

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
  const [selectedProvider, setSelectedProvider] = useState("openai");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingComplete, setStreamingComplete] = useState(false);
  const [streamingError, setStreamingError] = useState("");
  const [referencedText, setReferencedText] = useState("");
  const [referencedSource, setReferencedSource] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const { user, loading: authLoading } = useSupabase();

  const handleTextSelection = (text: string, source: string) => {
    console.log('🔍 Contribute handleTextSelection called:', { text, source });
    
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    console.log('🔍 Contribute text selection debug:', {
      selection,
      selectedText,
      length: selectedText?.length,
      user: !!user
    });
    
    if (selectedText && selectedText.length > 5) {
      console.log('✅ Contribute text selection valid');
      
      if (!user) {
        console.log('🔒 User not authenticated, showing waitlist');
        setShowWaitlist(true);
        return;
      }
      
      setSelectedText(selectedText);
      setSelectedSource(source);
      setShowReferenceModal(true);
    } else {
      console.log('❌ Contribute text selection invalid:', {
        hasText: !!selectedText,
        length: selectedText?.length,
        minLength: 5
      });
    }
  };

  const formatContent = (content: string, allowSelection = false) => {
    // Split by common AI conversation patterns
    const lines = content.split('\n');
    const formattedLines = lines.map((line, index) => {
      const trimmed = line.trim();
      
      // Check if it's a user message (common patterns)
      if (trimmed.startsWith('Human:') || trimmed.startsWith('User:') || trimmed.startsWith('Me:')) {
        const messageText = trimmed.replace(/^(Human:|User:|Me:)\s*/, '');
        return (
          <div key={index} className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
            <div className="text-sm font-medium text-blue-700 mb-1">Human</div>
            <div 
              className={`text-gray-800 ${allowSelection ? 'select-text cursor-text' : ''}`}
              onMouseUp={() => allowSelection && handleTextSelection(messageText, 'Human')}
            >
              {messageText}
            </div>
          </div>
        );
      }
      
      // Check if it's an AI message
      if (trimmed.startsWith('Assistant:') || trimmed.startsWith('AI:') || trimmed.startsWith('ChatGPT:') || trimmed.startsWith('Claude:')) {
        const messageText = trimmed.replace(/^(Assistant:|AI:|ChatGPT:|Claude:)\s*/, '');
        return (
          <div key={index} className="mb-4 p-4 bg-gray-50 border-l-4 border-gray-500 rounded-r">
            <div className="text-sm font-medium text-gray-700 mb-1">Assistant</div>
            <div 
              className={`text-gray-800 ${allowSelection ? 'select-text cursor-text' : ''}`}
              onMouseUp={() => allowSelection && handleTextSelection(messageText, 'Assistant')}
            >
              {messageText}
            </div>
          </div>
        );
      }
      
      // Regular line
      if (trimmed) {
        return (
          <div 
            key={index} 
            className={`mb-2 text-gray-800 ${allowSelection ? 'select-text cursor-text' : ''}`}
            onMouseUp={() => allowSelection && handleTextSelection(trimmed, 'Human')}
          >
            {trimmed}
          </div>
        );
      }
      
      return null;
    }).filter(Boolean);

    return formattedLines;
  };

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

  const handleContributionTypeSelect = (type: "ai" | "manual") => {
    if (!user) {
      setShowWaitlist(true);
      return;
    }
    setContributionType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowWaitlist(true);
      return;
    }

    if (contributionType === "ai" && !userPrompt.trim()) {
      setErrorMessage("Please enter a prompt for the AI.");
      return;
    }

    if (contributionType === "manual" && !manualContribution.trim()) {
      setErrorMessage("Please enter your contribution.");
      return;
    }

    setIsSubmitting(true);
    setStreamingResponse("");
    setErrorMessage("");
    
    try {
      if (contributionType === "ai") {
        // Handle streaming AI responses
        setIsStreaming(true);
        
        const response = await fetch('/api/contribute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: contributionType,
            parentThreadId: resolvedParams.id,
            userPrompt: userPrompt,
            referencedText: referencedText || null,
            referencedSource: referencedSource || null,
            provider: selectedProvider,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start AI generation');
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response stream available');
        }

        const decoder = new TextDecoder();
        let fullResponse = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'start') {
                    console.log('🚀 Streaming started:', data);
                  } else if (data.type === 'content') {
                    fullResponse += data.content;
                    setStreamingResponse(fullResponse);
                  } else if (data.type === 'complete') {
                    // AI generation complete
                    console.log('✅ Streaming complete:', data);
                    setIsStreaming(false);
                    setStreamingComplete(true);
                    setShowSuccess(true);
                    
                    // Redirect after a short delay
                    setTimeout(() => {
                      // Force a hard navigation to ensure the page reloads with new content
                      window.location.replace(`/thread/${resolvedParams.id}?scroll=bottom&t=${Date.now()}`);
                    }, 1500);
                  } else if (data.type === 'error') {
                    console.error('❌ Streaming error:', data.error);
                    setStreamingError(data.error);
                    throw new Error(data.error);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          // If streaming finished but we didn't get a complete event, show manual option
          if (!showSuccess && fullResponse && !streamingError) {
            console.log('⚠️ Streaming finished without complete event - showing manual option');
            setIsStreaming(false);
            setStreamingComplete(true);
          }
        }
        
      } else {
        // Handle manual contributions (non-streaming)
        const response = await fetch('/api/contribute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: contributionType,
            parentThreadId: resolvedParams.id,
            manualContent: manualContribution,
            referencedText: referencedText || null,
            referencedSource: referencedSource || null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create contribution');
        }
        
        // Show success state
        setShowSuccess(true);
        
        // Redirect after a short delay
        setTimeout(() => {
          // Force a hard navigation to ensure the page reloads with new content
          window.location.replace(`/thread/${resolvedParams.id}?scroll=bottom&t=${Date.now()}`);
        }, 1500);
      }
      
    } catch (error: any) {
      console.error('💥 Contribution error:', error);
      setErrorMessage(error.message);
      setIsStreaming(false);
      setStreamingError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </main>
    );
  }

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
          
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 font-medium">Error:</span>
              </div>
              <p className="text-red-600 mt-1">{errorMessage}</p>
              <button 
                onClick={() => setErrorMessage("")}
                className="text-red-500 hover:text-red-700 text-sm mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          )}
          
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
          <div className="space-y-4" data-contribution-form>
            <h2 className="text-xl font-semibold">How would you like to contribute?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="border rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleContributionTypeSelect("ai")}
              >
                <div className="space-y-2">
                  <h3 className="font-medium">Continue with AI</h3>
                  <p className="text-sm text-muted-foreground">
                    Add a new prompt and get an AI response that continues the conversation. Uses your API key from Settings.
                  </p>
                </div>
              </div>
              <div 
                className="border rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleContributionTypeSelect("manual")}
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
                  <strong>Note:</strong> The AI will be given the full context of the original conversation before responding to your prompt. Using your API key from Settings.
                </p>
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="ai-provider">AI Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI (GPT-4o-mini)</SelectItem>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="google">Google (Gemini)</SelectItem>
                  </SelectContent>
                </Select>
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

        {/* Streaming Response Display */}
        {(isStreaming || streamingComplete) && streamingResponse && (
          <div className={`border p-6 rounded-lg ${
            isStreaming 
              ? 'bg-blue-50 border-blue-200' 
              : streamingComplete && !showSuccess
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <h3 className="font-medium text-blue-900">AI is responding...</h3>
                  </>
                ) : streamingComplete && !showSuccess ? (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <h3 className="font-medium text-yellow-900">Response ready - save to thread?</h3>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h3 className="font-medium text-green-900">Response saved!</h3>
                  </>
                )}
              </div>
              
              {streamingComplete && !showSuccess && (
                <Button 
                  onClick={async () => {
                    // Manually save the response
                    try {
                      setIsSubmitting(true);
                      const response = await fetch('/api/contribute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'manual',
                          parentThreadId: resolvedParams.id,
                          manualContent: `Human: ${userPrompt}\n\nAssistant: ${streamingResponse}`,
                          referencedText: referencedText || null,
                          referencedSource: referencedSource || null,
                          source: `AI Contribution (${selectedProvider})`, // Override the source to show it's AI
                        }),
                      });
                      
                      if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Failed to save response');
                      }
                      
                      setShowSuccess(true);
                      setTimeout(() => {
                        // Force a hard navigation to ensure the page reloads with new content
                        window.location.replace(`/thread/${resolvedParams.id}?scroll=bottom&t=${Date.now()}`);
                      }, 1500);
                    } catch (error: any) {
                      setErrorMessage(error.message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save to Thread'}
                </Button>
              )}
            </div>
            <div className="prose prose-sm max-w-none text-gray-800">
              {streamingResponse.split('\\n').map((line, index) => (
                <p key={index} className="mb-2 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            {streamingError && (
              <div className="mt-3 text-red-600 text-sm">
                Error: {streamingError}
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-medium text-green-900 mb-1">Contribution Added!</h3>
            <p className="text-green-700 text-sm">Redirecting you to the updated conversation...</p>
          </div>
        )}

        {/* Original Thread Context - moved to bottom */}
        <div className="bg-muted/30 p-6 rounded-lg">
          <h2 className="font-medium mb-3">Original Conversation</h2>
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
            <div className="space-y-2">
              {formatContent(thread.content, true)}
            </div>
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
      
      {/* Reference Modal */}
      {showReferenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reply to Selected Text</h3>
            <div className="bg-muted p-3 rounded mb-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Replying to ({selectedSource}):
              </div>
              <div className="text-sm italic">"{selectedText}"</div>
            </div>
            <p className="text-muted-foreground mb-4">
              This selected text will be included as context when you contribute to the conversation.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setReferencedText(selectedText);
                  setReferencedSource(selectedSource);
                  setShowReferenceModal(false);
                  // Clear browser selection to allow new selections
                  window.getSelection()?.removeAllRanges();
                  // Scroll to contribution form
                  document.querySelector('[data-contribution-form]')?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                }}
                className="flex-1"
              >
                Continue with This Quote
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowReferenceModal(false);
                  // Clear browser selection to allow new selections
                  window.getSelection()?.removeAllRanges();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-600">Success!</h3>
              <p className="text-muted-foreground">
                Your contribution has been added to the conversation.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Redirecting to thread...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <WaitlistModal 
        isOpen={showWaitlist} 
        onClose={() => setShowWaitlist(false)} 
      />

      <TypingLoader 
        isVisible={isSubmitting && contributionType === "ai" && !isStreaming && !streamingResponse} 
        onDismiss={() => {
          // Don't allow dismissing while AI is generating
        }}
        customMessage="Summoning the AI muses to craft your contribution..."
      />
    </main>
  );
}