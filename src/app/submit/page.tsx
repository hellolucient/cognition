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
  const { user } = useSupabase();
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

  // Check for pre-filled content from bookmarklet
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromBookmarklet = urlParams.get('from') === 'bookmarklet';
    const passedShare = urlParams.get('share');
    const passedPlatform = urlParams.get('platform');
    if (passedShare) {
      try {
        setShareUrl(decodeURIComponent(passedShare));
      } catch {
        setShareUrl(passedShare);
      }
    }
    
    if (fromBookmarklet) {
      // Check sessionStorage for content from bookmarklet
      const storedContent = sessionStorage.getItem('vanwinkle_chat');
      console.log('Bookmarklet mode - sessionStorage content:', storedContent ? `Found ${storedContent.length} characters` : 'Not found');
      if (storedContent) {
        setChatContent(storedContent);
        
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
            detectAndSetPlatform(storedContent);
          }
        } else {
          detectAndSetPlatform(storedContent);
        }
        
        // Clean up
        sessionStorage.removeItem('vanwinkle_chat');
        window.history.replaceState({}, '', window.location.pathname);
        console.log('Content loaded from bookmarklet');
      } else {
        console.log('No content found in sessionStorage from bookmarklet');
      }
    } else {
      // Fallback: check URL parameters (for backwards compatibility)
      const prefilledContent = urlParams.get('content');
      if (prefilledContent) {
        const decodedContent = decodeURIComponent(prefilledContent);
        setChatContent(decodedContent);
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
    
    // Check for platform-specific markers in the content
    if (content.includes('🤖 ChatGPT:')) {
      detectedPlatform = 'ChatGPT';
    } else if (content.includes('🤖 Claude:')) {
      detectedPlatform = 'Claude';
    } else if (content.includes('🤖 Gemini:')) {
      detectedPlatform = 'Gemini';
    } else if (content.includes('🤖 Copilot:')) {
      detectedPlatform = 'Copilot';
    } else if (content.includes('🤖 Grok:')) {
      detectedPlatform = 'Grok';
    } else if (content.includes('🤖 Perplexity:')) {
      detectedPlatform = 'Perplexity';
    }
    
    if (detectedPlatform && AI_SOURCES.includes(detectedPlatform)) {
      setSource(detectedPlatform);
      console.log(`Auto-detected platform: ${detectedPlatform}`);
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
      
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: chatContent,
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
      
      // Force redirect using window.location as backup
      setTimeout(() => {
        window.location.href = '/?posted=true';
      }, 100);
      
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
                onChange={(e) => setChatContent(e.target.value)}
                required
                rows={15}
              />
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
                <Label htmlFor="source">AI Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI source" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_SOURCES.map((aiSource) => (
                      <SelectItem key={aiSource} value={aiSource}>
                        {aiSource}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {source === "Other" && (
                  <Input
                    placeholder="Enter custom AI source"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                  />
                )}
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
    </main>
  );
}
