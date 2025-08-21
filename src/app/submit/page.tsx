"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { WaitlistModal } from "@/components/auth/waitlist-modal";
import { InviteSignupModal } from "@/components/auth/invite-signup-modal";
import { EmailSignInModal } from "@/components/auth/email-signin-modal";
import { TypingLoader } from "@/components/ui/typing-loader";
import Link from "next/link";

const AI_SOURCES = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Perplexity",
  "Copilot",
  "Grok",
  "Other"
];

const POPULAR_TAGS = [
  "programming",
  "creative-writing",
  "science",
  "business",
  "education",
  "philosophy",
  "productivity",
  "debugging",
  "brainstorming",
  "research"
];

export default function SubmitPage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [chatContent, setChatContent] = useState("");
  const [source, setSource] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [tags, setTags] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [step, setStep] = useState<"input" | "review">("input");
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showInviteSignup, setShowInviteSignup] = useState(false);
  const [showEmailSignIn, setShowEmailSignIn] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [formattedPreview, setFormattedPreview] = useState<string>("");

  // Function to format citations using structured data from bookmarklet
  const formatCitations = (text: string) => {
    console.log('🔍 Submit page formatCitations called with:', text.substring(0, 200) + '...');
    
    // Check if we have structured citation data from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const citationsParam = urlParams.get('citations');
    
    if (citationsParam) {
      try {
        const citations = JSON.parse(decodeURIComponent(citationsParam));
        console.log('✅ Found structured citations from URL:', citations);
        
        // Deduplicate citations to avoid processing the same source+number multiple times
        const uniqueCitations = citations.filter((citation: { source: string; number: number }, index: number, self: any[]) => 
          index === self.findIndex((c: { source: string; number: number }) => 
            c.source === citation.source && c.number === citation.number
          )
        );
        console.log('🔍 Deduplicated citations:', uniqueCitations.length, 'unique out of', citations.length, 'total');
        
        // Format each unique citation in the text
        let formatted = text;
        console.log('🔍 Original text to process:', text.substring(0, 500) + '...');
        
        uniqueCitations.forEach((citation: { source: string; number: number }, index: number) => {
          const citationPattern = new RegExp(`\\b${citation.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\+${citation.number}\\b`, 'g');
          console.log(`🔍 Processing citation ${index + 1}:`, citation.source, '+', citation.number);
          console.log(`🔍 Regex pattern:`, citationPattern);
          
          // Check if the pattern exists in the text
          const matches = formatted.match(citationPattern);
          console.log(`🔍 Found ${matches ? matches.length : 0} matches for`, citation.source, '+', citation.number);
          
          if (matches && matches.length > 0) {
            formatted = formatted.replace(citationPattern, (match) => {
              console.log('✅ Formatting citation:', match, '→', citation.source, '+', citation.number);
              return `<span class="inline-flex items-center px-1 py-0.5 rounded-md text-xs bg-gray-50 text-gray-600 font-mono border border-gray-200"><span class="text-[9px] mr-1 opacity-75">${citation.source}</span><span class="text-[9px] opacity-75">+${citation.number}</span></span>`;
            });
          } else {
            console.log('⚠️ No matches found for citation pattern:', citation.source, '+', citation.number);
          }
        });
        
        console.log('🔍 Submit page formatCitations result (structured):', formatted.substring(0, 200) + '...');
        return formatted;
      } catch (error) {
        console.error('❌ Error parsing citations data from URL:', error);
        // Fall back to regex pattern matching if structured data fails
      }
    }
    
    // Fallback: Use regex pattern matching (legacy behavior)
    console.log('⚠️ No structured citations found, using regex fallback');
    
    // Handle the actual pattern: "Source\n+6" (source first, then number on next line)
    let formatted = text.replace(/([A-Za-z][A-Za-z0-9\s\-\.]+)\s*\n\s*\+(\d+)/g, (match, source, number) => {
      console.log('✅ Multi-line citation match (fallback):', match, '→', source.trim(), '+', number);
      return `${source.trim()} <span class="inline-flex items-center px-1 py-0.5 rounded-md text-xs bg-gray-50 text-gray-600 ml-1 font-mono text-[9px] opacity-75 border border-gray-200">+${number}</span>`;
    });
    
    // Handle inline citations like "Reddit +6"
    formatted = formatted.replace(/(\b[A-Za-z][A-Za-z0-9\s\-\.]+)\s*\+(\d+)/g, (match, source, number) => {
      console.log('✅ Inline citation match (fallback):', match, '→', source.trim(), '+', number);
                         return `${source.trim()} <span class="inline-flex items-center px-1 py-0.5 rounded-md text-xs bg-gray-50 text-gray-600 ml-1 font-mono text-[9px] opacity-75 border border-gray-200">+${number}</span>`;
    });
    
    console.log('🔍 Submit page formatCitations result (fallback):', formatted.substring(0, 200) + '...');
    return formatted;
  };

  // Function to wait for citations to be available and then format
  const formatCitationsWithRetry = (text: string, maxRetries = 10) => {
    return new Promise<string>((resolve) => {
      let attempts = 0;
      
      const tryFormat = () => {
        attempts++;
        console.log(`🔍 Attempt ${attempts}: Checking for citations...`);
        
        // Check URL parameter first (new method)
        const urlParams = new URLSearchParams(window.location.search);
        const citationsParam = urlParams.get('citations');
        
        if (citationsParam) {
          console.log('✅ Citations found in URL on attempt', attempts);
          resolve(formatCitations(text));
        } else if (attempts < maxRetries) {
          console.log(`⏳ Citations not ready yet, retrying in 100ms... (${attempts}/${maxRetries})`);
          setTimeout(tryFormat, 100);
        } else {
          console.log('⚠️ Max retries reached, using fallback formatting');
          resolve(formatCitations(text));
        }
      };
      
      tryFormat();
    });
  };

  // Check for pre-filled content from bookmarklet
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromBookmarklet = urlParams.get('from') === 'bookmarklet';
    const passedShare = urlParams.get('share');
    const passedPlatform = urlParams.get('platform');
    const passedContent = urlParams.get('content');
    const useClipboard = urlParams.get('use_clipboard') === 'true';
    
    if (passedShare) {
      try {
        setShareUrl(decodeURIComponent(passedShare));
      } catch {
        setShareUrl(passedShare);
      }
    }
    
    if (fromBookmarklet) {
      console.log('🔍 Bookmarklet detected, checking for content...');
      console.log('🔍 URL params:', { passedContent: !!passedContent, useClipboard, passedPlatform, passedShare });
      console.log('🔍 Content length in URL:', passedContent ? passedContent.length : 'N/A');
      
      let contentToUse = '';
      
      // Priority 1: Check sessionStorage if bookmarklet indicated to use clipboard (for all content now)
      if (useClipboard) {
        const storedContent = sessionStorage.getItem('vanwinkle_chat');
        if (storedContent) {
          contentToUse = storedContent;
          console.log('✅ Content loaded from sessionStorage:', contentToUse.length, 'characters');
          sessionStorage.removeItem('vanwinkle_chat');
        } else {
          console.log('⚠️ use_clipboard=true but no content found in sessionStorage');
        }
      }
      
      // Priority 2: Fallback to URL parameter (legacy support)
      if (!contentToUse && passedContent) {
        try {
          contentToUse = decodeURIComponent(passedContent);
          console.log('✅ Content loaded from URL parameter (fallback):', contentToUse.length, 'characters');
        } catch (error) {
          console.error('Failed to decode content from URL:', error);
        }
      }
      
      // Priority 3: Final fallback to sessionStorage for any remaining cases
      if (!contentToUse) {
        const storedContent = sessionStorage.getItem('vanwinkle_chat');
        if (storedContent) {
          contentToUse = storedContent;
          console.log('✅ Final fallback content loaded from sessionStorage:', contentToUse.length, 'characters');
          sessionStorage.removeItem('vanwinkle_chat');
        }
      }
      
      if (contentToUse) {
        console.log('🔍 Raw content from bookmarklet:', contentToUse.substring(0, 200) + '...');
        // Keep raw content in textarea, but format for preview
        setChatContent(contentToUse);
        console.log('🔍 Raw content set in textarea, formatted version available for preview');
        
        // Prefer URL param platform if present; else detect from content
        if (passedPlatform) {
          const normalized = passedPlatform.trim().toLowerCase();
          const mapping: Record<string, string> = {
            chatgpt: 'ChatGPT',
            claude: 'Claude',
            gemini: 'Gemini',
            perplexity: 'Perplexity',
            copilot: 'Copilot',
            grok: 'Grok',
          };
          if (mapping[normalized]) {
            setSource(mapping[normalized]);
          } else {
            detectAndSetPlatform(contentToUse);
          }
        } else {
          detectAndSetPlatform(contentToUse);
        }
        
        // Clean up URL parameters
        window.history.replaceState({}, '', window.location.pathname);
        console.log('✅ Bookmarklet content loaded and ready');
      } else {
        console.log('⚠️ No content found from bookmarklet (URL param or sessionStorage)');
      }
    } else {
      // Fallback: check URL parameters (for backwards compatibility)
      const prefilledContent = urlParams.get('content');
      if (prefilledContent) {
        const decodedContent = decodeURIComponent(prefilledContent);
        console.log('🔍 Raw content from URL param:', decodedContent.substring(0, 200) + '...');
        // Keep raw content in textarea, but format for preview
        setChatContent(decodedContent);
        console.log('🔍 Raw content from URL param set in textarea, formatted version available for preview');
        // Platform param may be present too
        if (passedPlatform) {
          const normalized = passedPlatform.trim().toLowerCase();
          const mapping: Record<string, string> = {
            chatgpt: 'ChatGPT',
            claude: 'Claude',
            gemini: 'Gemini',
            perplexity: 'Perplexity',
            copilot: 'Copilot',
            grok: 'Grok',
          };
          if (mapping[normalized]) {
            setSource(mapping[normalized]);
          } else {
            detectAndSetPlatform(decodedContent);
          }
        } else {
          detectAndSetPlatform(decodedContent);
        }
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Watch for citations and update formatted preview
  useEffect(() => {
    if (chatContent) {
      const checkForCitations = async () => {
        const formatted = await formatCitationsWithRetry(chatContent);
        setFormattedPreview(formatted);
      };
      
      checkForCitations();
    }
  }, [chatContent]);

  // Function to detect platform from conversation content or embedded meta
  const detectAndSetPlatform = (content: string) => {
    if (!content) return;
    
    // Check for embedded vanwinkle metadata header
    try {
      const metaStart = content.indexOf('--- vanwinkle-meta ---');
      const metaEnd = content.indexOf('--- end-vanwinkle-meta ---');
      if (metaStart !== -1 && metaEnd !== -1 && metaEnd > metaStart) {
        const metaBlock = content.slice(metaStart, metaEnd);
        const platformLine = metaBlock.split('\n').find(l => l.toLowerCase().startsWith('platform:'));
        const urlLine = metaBlock.split('\n').find(l => l.toLowerCase().startsWith('url:'));
        if (platformLine) {
          const p = platformLine.split(':')[1]?.trim();
          const mapping: Record<string, string> = {
            chatgpt: 'ChatGPT',
            claude: 'Claude',
            gemini: 'Gemini',
            perplexity: 'Perplexity',
            copilot: 'Copilot',
            grok: 'Grok',
            ChatGPT: 'ChatGPT',
            Claude: 'Claude',
            Gemini: 'Gemini',
            Perplexity: 'Perplexity',
            Copilot: 'Copilot',
            Grok: 'Grok',
          };
          if (p && mapping[p]) {
            setSource(mapping[p]);
          }
        }
        if (urlLine) {
          const u = urlLine.split(':').slice(1).join(':').trim();
          if (u) setShareUrl(u);
        }
      }
    } catch {}

    let detectedPlatform = null;
    
    // Check for platform-specific markers in the content (more flexible patterns)
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('chatgpt') || content.includes('🤖 ChatGPT:') || lowerContent.includes('chat.openai') || lowerContent.includes('gpt-')) {
      detectedPlatform = 'ChatGPT';
    } else if (lowerContent.includes('claude') || content.includes('🤖 Claude:') || lowerContent.includes('anthropic')) {
      detectedPlatform = 'Claude';
    } else if (lowerContent.includes('gemini') || content.includes('🤖 Gemini:') || lowerContent.includes('google ai') || lowerContent.includes('bard')) {
      detectedPlatform = 'Gemini';
    } else if (lowerContent.includes('copilot') || content.includes('🤖 Copilot:') || lowerContent.includes('microsoft copilot')) {
      detectedPlatform = 'Copilot';
    } else if (lowerContent.includes('grok') || content.includes('🤖 Grok:') || lowerContent.includes('xai')) {
      detectedPlatform = 'Grok';
    } else if (lowerContent.includes('perplexity') || content.includes('🤖 Perplexity:')) {
      detectedPlatform = 'Perplexity';
    }
    
    if (detectedPlatform && AI_SOURCES.includes(detectedPlatform)) {
      setSource(detectedPlatform);
      console.log(`Auto-detected platform: ${detectedPlatform}`);
    } else if (!source || source === "") {
      // Only set to "Other" if no source is currently set
      setSource('Other');
      console.log('No platform detected, defaulting to Other');
    }
  };

  const handleTagClick = (tag: string) => {
    if (tag === "Other") {
      // Handle custom tag input
      return;
    }
    
    const currentTags = tags.split(",").map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
      const newTags = currentTags.length > 0 ? `${tags}, ${tag}` : tag;
      setTags(newTags);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim()) {
      const currentTags = tags.split(",").map(t => t.trim()).filter(Boolean);
      if (!currentTags.includes(customTag.trim())) {
        const newTags = currentTags.length > 0 ? `${tags}, ${customTag.trim()}` : customTag.trim();
        setTags(newTags);
      }
      setCustomTag("");
    }
  };

  const generateSummary = async () => {
    if (!chatContent.trim()) {
      alert("Please enter the conversation content first.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: chatContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setTitle(data.title || 'AI Conversation');
      setSummary(data.summary);
      setStep("review");
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!summary.trim()) {
      alert("Please provide a summary before posting.");
      return;
    }

    setIsPosting(true);
    try {
      const finalSource = source === "Other" ? customSource : source;
      
      // Format citations before sending to API
              const formattedContent = await formatCitationsWithRetry(chatContent);
      console.log('🔍 Sending formatted content to API:', formattedContent.substring(0, 200) + '...');
      
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: formattedContent,
          source: finalSource,
          tags,
          title,
          summary,
          shareUrl: shareUrl || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create thread');
      }
      
      // Success! Reset loading state and redirect
      setIsPosting(false);
      
      // Add a longer delay to ensure database consistency and add cache busting
      setTimeout(() => {
        window.location.href = `/?posted=true&t=${Date.now()}`;
      }, 1000);
      
    } catch (error: any) {
      alert(`Error posting: ${error.message}`);
      setIsPosting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowWaitlist(true);
      return;
    }
    
    if (step === "input") {
      generateSummary();
    } else {
      handlePost();
    }
  };

  // Show loading state while auth is being checked (prevents flash)
  if (authLoading) {
    return (
      <main className="container mx-auto max-w-2xl py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="text-6xl">💬</div>
          <h1 className="text-3xl font-bold">Loading...</h1>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Checking your account</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container mx-auto max-w-2xl py-8">
        <div className="space-y-6">
          <div>
            <Button variant="outline" asChild className="mb-4">
              <Link href="/">← Back to Feed</Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Submit a Conversation</h1>
            <p className="text-muted-foreground">
              Paste a complete conversation you've had with an AI. It will be summarized and shared with the community.
            </p>
          </div>

          {/* Prominent Sign-in Required Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-blue-900 mb-3">Sign In Required</h2>
            <p className="text-blue-700 mb-6 text-lg">
              You need to be signed in to submit conversations to our community.
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
              <Button variant="outline" size="lg" asChild>
                <Link href="/">Browse Conversations</Link>
              </Button>
            </div>
          </div>

          {/* Preview of what they could do */}
          <div className="bg-muted/30 p-6 rounded-lg">
            <h3 className="font-semibold mb-3">What you can do once signed in:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Submit your AI conversations to the community
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Get AI-generated summaries of your chats
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Contribute to other people's conversations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Share invite codes with friends
              </li>
            </ul>
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

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="space-y-4">
        <div>
          <Button variant="outline" asChild className="mb-4">
            <Link href="/">← Back to Feed</Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Submit a Conversation</h1>
          <p className="text-muted-foreground">
            Paste a complete conversation you've had with an AI. It will be summarized and shared with the community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === "input" && (
            <div className="grid w-full gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="chat-content">The full chat transcript</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setChatContent(text);
                      // Auto-detect platform from pasted content
                      detectAndSetPlatform(text);
                    } catch (err) {
                      alert('Could not read clipboard. Please paste manually (Cmd+V).');
                    }
                  }}
                >
                  📋 Paste from Clipboard
                </Button>
              </div>
              <Textarea
                id="chat-content"
                placeholder="Paste your entire chat log here, including both your prompts and the AI's responses."
                value={chatContent}
                onChange={(e) => {
                  setChatContent(e.target.value);
                  // Auto-detect platform when content changes
                  detectAndSetPlatform(e.target.value);
                }}
                required
                rows={15}
              />
              
              {/* Preview area for formatted content */}
              {chatContent && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview (with formatted citations):</Label>
                  <div className="text-xs text-gray-500 mb-2">
                    Raw content preview: {chatContent.substring(0, 100)}...
                  </div>
                  <div 
                    className="text-sm text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: formattedPreview || 'Loading citations...' }}
                  />
                </div>
              )}
            </div>
          )}
          
          {step === "review" && (
            <div className="space-y-4">
              <div className="grid w-full gap-2">
                <Label htmlFor="generated-title">Generated Title (you can edit this)</Label>
                <Input
                  id="generated-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a catchy title for your conversation"
                  maxLength={100}
                />
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="generated-summary">Generated Summary (you can edit this)</Label>
                <Textarea
                  id="generated-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Review your submission:</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Source:</strong> {source === "Other" ? customSource : source}</div>
                  <div><strong>Tags:</strong> {tags || "None"}</div>
                  <div><strong>Content length:</strong> {chatContent.length} characters</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep("input")}
                >
                  Back to Edit
                </Button>
              </div>
            </div>
          )}
          
          {step === "input" && (
            <>
              <div className="grid w-full gap-2">
                <Label htmlFor="source">AI Platform (Auto-detected)</Label>
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Detected:</span>
                    <span className="font-medium">{source === "Other" ? "Unknown Platform" : source}</span>
                  </div>
                  {source !== "Other" && (
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      ✓ Verified
                    </div>
                  )}
                  {source === "Other" && (
                    <div className="flex-1">
                      <Input
                        placeholder="Enter AI platform name"
                        value={customSource}
                        onChange={(e) => setCustomSource(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Platform is automatically detected from your conversation content or bookmarklet data.
                </p>
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Your selected tags will appear here"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  readOnly
                />
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Click to add tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTagClick(tag)}
                        className="h-8"
                      >
                        {tag}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Toggle custom tag input
                        document.getElementById('custom-tag')?.focus();
                      }}
                      className="h-8"
                    >
                      Other
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="custom-tag"
                      placeholder="Enter custom tag"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomTag();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addCustomTag} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <Button 
            type="submit" 
            disabled={isGenerating || isPosting}
            className="w-full"
          >
            {isGenerating ? "Generating Summary..." : 
             step === "input" ? "Generate Summary" : 
             isPosting ? "Posting..." : "Post to Community"}
          </Button>
        </form>
      </div>
      
      <EmailSignInModal
        isOpen={showEmailSignIn}
        onClose={() => setShowEmailSignIn(false)}
      />
      
      <WaitlistModal 
        isOpen={showWaitlist} 
        onClose={() => setShowWaitlist(false)} 
      />

      <TypingLoader 
        isLoading={authLoading || isGenerating || isPosting}
        customMessage={
          authLoading ? "Checking your account..." :
          isGenerating ? "Crafting the perfect summary for your conversation..." :
          isPosting ? "Launching your idea into the vanwinkle universe..." :
          undefined
        }
      />
    </main>
  );
}
