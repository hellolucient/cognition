"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState, useEffect, use, useRef } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { WaitlistModal } from "@/components/auth/waitlist-modal";
import { TypingLoader } from "@/components/ui/typing-loader";
import { AILoadingModal } from "@/components/ui/ai-loading-modal";

interface Thread {
  id: string;
  title: string | null;
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
  contributions?: Thread[];
  _count: {
    comments: number;
    upvotes: number;
    downvotes: number;
  };
}

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debug AI modal loading state
  useEffect(() => {
    console.log('🤖 Thread AI Modal - Loading state changed:', loading);
  }, [loading]);
  const [voteLoading, setVoteLoading] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [hasDownvoted, setHasDownvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const { user } = useSupabase();

  useEffect(() => {
    fetchThread();
    fetchVoteStatus();
  }, [resolvedParams.id]);

  const fetchVoteStatus = async () => {
    try {
      const response = await fetch(`/api/threads/${resolvedParams.id}/vote`);
      if (response.ok) {
        const data = await response.json();
        setUpvoteCount(data.upvoteCount);
        setDownvoteCount(data.downvoteCount);
        setHasUpvoted(data.hasUpvoted);
        setHasDownvoted(data.hasDownvoted);
      }
    } catch (error) {
      console.error('Error fetching vote status:', error);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    setVoteLoading(true);
    try {
      const response = await fetch(`/api/threads/${resolvedParams.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });

      if (response.ok) {
        const data = await response.json();
        setUpvoteCount(data.upvoteCount);
        setDownvoteCount(data.downvoteCount);
        setHasUpvoted(data.hasUpvoted);
        setHasDownvoted(data.hasDownvoted);
      } else {
        console.error('Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoteLoading(false);
    }
  };

  // Handle scroll behavior based on navigation context
  useEffect(() => {
    if (thread) {
      const urlParams = new URLSearchParams(window.location.search);
      const scrollToBottom = urlParams.get('scroll') === 'bottom';
      
      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (scrollToBottom && thread.contributions && thread.contributions.length > 0) {
          // Coming from contribute page - scroll to show the complete latest contribution
          if (conversationRef.current) {
            // Scroll to a position well above the contribution to ensure full visibility
            const element = conversationRef.current;
            const elementRect = element.getBoundingClientRect();
            const elementTop = elementRect.top + window.scrollY;
            
            // Scroll to show the contribution with generous padding above
            // This ensures we see the full contribution, not just the title
            const scrollPosition = elementTop - 200; // More padding to show full content
            
            window.scrollTo({ 
              top: Math.max(0, scrollPosition), 
              behavior: 'smooth' 
            });
          }
          
          // Clean up URL parameter
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        } else {
          // Normal "Read Full" navigation - scroll to top of page
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 300); // Increased delay to ensure content is fully rendered
    }
  }, [thread]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else if (diffInMinutes < 10080) { // 7 days
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } else {
      // For older posts, show actual date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const [selectedText, setSelectedText] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [textSegmentVotes, setTextSegmentVotes] = useState<{[key: string]: 'like' | 'dislike' | null}>({});
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("text");
  const [isExporting, setIsExporting] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);

  // Set up text selection listener that triggers immediately on selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 5) {
        // Find which element contains the selection
        const range = selection?.getRangeAt(0);
        const container = range?.commonAncestorContainer;
        
        // Traverse up to find the source element
        let sourceElement = container?.nodeType === Node.TEXT_NODE 
          ? container.parentElement 
          : container as Element;
          
        let source = 'Unknown';
        while (sourceElement && sourceElement !== document.body) {
          if (sourceElement.getAttribute('data-source')) {
            source = sourceElement.getAttribute('data-source')!;
            break;
          }
          sourceElement = sourceElement.parentElement;
        }
        
        console.log('✅ Text selected:', { selectedText, source });
        console.log('🔍 Setting modal state:', { 
          selectedText, 
          selectedSource, 
          showReferenceModal: true,
          user: !!user 
        });
        
        if (!user) {
          console.log('🔒 User not authenticated, showing waitlist');
          setShowWaitlist(true);
          return;
        }
        
        setSelectedText(selectedText);
        setSelectedSource(source);
        setShowReferenceModal(true);
        
        console.log('🔍 Modal state after setState:', { 
          selectedText, 
          selectedSource, 
          showReferenceModal: true 
        });
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [user]);

  const handleTextSelection = (text: string, source: string) => {
    // Keep this function for backward compatibility, but it's now handled by selectionchange
    console.log('🔍 Thread handleTextSelection called (legacy):', { text, source });
  };

  const handleTextSegmentVote = async (text: string, voteType: 'like' | 'dislike') => {
    if (!user) return;
    
    const segmentKey = `${text.slice(0, 50)}...`; // Use first 50 chars as key
    const currentVote = textSegmentVotes[segmentKey];
    const newVote = currentVote === voteType ? null : voteType; // Toggle if same vote
    
    // Update local state immediately
    setTextSegmentVotes(prev => ({
      ...prev,
      [segmentKey]: newVote
    }));
    
    // TODO: Send to API to persist vote
    console.log('📊 Text segment vote:', { text: segmentKey, vote: newVote });
  };

  const getTextWithVoteIndicators = (text: string) => {
    // For now, we'll just return the text as-is
    // In the future, we could highlight voted segments
    return text;
  };

  const handleContributeClick = () => {
    if (!user) {
      setShowWaitlist(true);
      return;
    }
    if (!thread) {
      return;
    }
    // Navigate to contribute page
    window.location.href = `/contribute/${thread.id}`;
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExport = async () => {
    if (!thread) return;
    
    setIsExporting(true);
    try {
      const response = await fetch(`/api/threads/${thread.id}/export?format=${exportFormat}`);
      
      if (response.ok) {
        // Get the filename from the Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `conversation-export.${exportFormat === 'json' ? 'json' : exportFormat === 'markdown' ? 'md' : 'txt'}`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setShowExportModal(false);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export conversation. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Function to format citations using structured data from bookmarklet
  const formatCitations = (text: string) => {
    console.log('🔍 formatCitations called with:', text.substring(0, 200) + '...');
    
    // Check if we have structured citation data from the bookmarklet
    const citationsData = sessionStorage.getItem('vanwinkle_citations');
    if (citationsData) {
      try {
        const citations = JSON.parse(citationsData);
        console.log('✅ Found structured citations:', citations);
        
        // Format each citation in the text
        let formatted = text;
        citations.forEach((citation: { source: string; number: number }) => {
          const citationPattern = new RegExp(`\\b${citation.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\+${citation.number}\\b`, 'g');
          formatted = formatted.replace(citationPattern, (match) => {
            console.log('✅ Formatting citation:', match, '→', citation.source, '+', citation.number);
            return `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-mono"><span class="text-[10px] mr-1">${citation.source}</span>+${citation.number}</span>`;
          });
        });
        
        console.log('🔍 formatCitations result (structured):', formatted.substring(0, 200) + '...');
        return formatted;
      } catch (error) {
        console.error('❌ Error parsing citations data:', error);
        // Fall back to regex pattern matching if structured data fails
      }
    }
    
    // Fallback: Use regex pattern matching (legacy behavior)
    console.log('⚠️ No structured citations found, using regex fallback');
    
    // Handle the actual pattern: "Source\n+6" (source first, then number on next line)
    let formatted = text.replace(/([A-Za-z][A-Za-z0-9\s\-\.]+)\s*\n\s*\+(\d+)/g, (match, source, number) => {
      console.log('✅ Multi-line citation match (fallback):', match, '→', source.trim(), '+', number);
      return `${source.trim()} <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 ml-1 font-mono text-[10px] italic">+${number}</span>`;
    });
    
    // Handle inline citations like "Reddit +6"
    formatted = formatted.replace(/(\b[A-Za-z][A-Za-z0-9\s\-\.]+)\s*\+(\d+)/g, (match, source, number) => {
      console.log('✅ Inline citation match (fallback):', match, '→', source.trim(), '+', number);
      return `${source.trim()} <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 ml-1 font-mono text-[10px] italic">+${number}</span>`;
    });
    
    console.log('🔍 formatCitations result (fallback):', formatted.substring(0, 200) + '...');
    return formatted;
  };

  const formatContent = (content: string, allowSelection = false) => {
    // First, format citations in the entire content
    const contentWithCitations = formatCitations(content);
    
    // Split by common AI conversation patterns
    const lines = contentWithCitations.split('\n');
    const formattedLines = lines.map((line, index) => {
      const trimmed = line.trim();
      
      // Check if it's a user message (common patterns)
      if (trimmed.startsWith('Human:') || trimmed.startsWith('User:') || trimmed.startsWith('Me:')) {
        const messageText = trimmed.replace(/^(Human:|User:|Me:)\s*/, '');
        return (
          <div key={index} className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
            <div className="text-sm font-medium text-blue-700 mb-1">Human</div>
            <div 
              className={`text-gray-800 ${allowSelection ? 'select-text cursor-text' : ''} relative`}
              data-source="Human"
              dangerouslySetInnerHTML={{ __html: messageText }}
            >
              {/* Vote indicator for Human messages */}
              {Object.entries(textSegmentVotes).some(([key, vote]) => 
                vote && messageText.includes(key.replace('...', ''))
              ) && (
                <span className="absolute -right-2 -top-2">
                  {Object.entries(textSegmentVotes).find(([key, vote]) => 
                    vote && messageText.includes(key.replace('...', ''))
                  )?.[1] === 'like' ? '👍' : '👎'}
                </span>
              )}
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
              className={`text-gray-800 ${allowSelection ? 'select-text cursor-text' : ''} relative`}
              data-source="Assistant"
              dangerouslySetInnerHTML={{ __html: messageText }}
            >
              {/* Vote indicator for Assistant messages */}
              {Object.entries(textSegmentVotes).some(([key, vote]) => 
                vote && messageText.includes(key.replace('...', ''))
              ) && (
                <span className="absolute -right-2 -top-2">
                  {Object.entries(textSegmentVotes).find(([key, vote]) => 
                    vote && messageText.includes(key.replace('...', ''))
                  )?.[1] === 'like' ? '👍' : '👎'}
                </span>
              )}
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
            data-source="Thread"
            dangerouslySetInnerHTML={{ __html: trimmed }}
          />
        );
      }
      
      return null;
    }).filter(Boolean);

    return formattedLines;
  };

  if (loading) {
    return (
      <>
        <main className="container mx-auto py-8">
          <div className="text-center">Loading thread...</div>
        </main>
        <TypingLoader 
          isLoading={loading}
          customMessage="Assembling the conversation pieces... this might take a moment of philosophical reflection."
        />
      </>
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
            <Link href="/">← Back to Feed</Link>
          </Button>
        </div>

        {/* Thread Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {thread.author.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div className="font-medium">{thread.author.name || "Anonymous"}</div>
              <div className="text-sm text-muted-foreground">
                {formatDate(thread.createdAt)}
                {thread.source && (
                  <>
                    {" • "}
                    <Badge variant="secondary">{thread.source}</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          {thread.title && (
            <div>
              <h1 className="text-2xl font-bold text-foreground">{thread.title}</h1>
            </div>
          )}

          {/* Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h2 className="font-medium mb-2">Summary</h2>
            <p className="text-foreground leading-relaxed">{thread.summary}</p>
          </div>

          {/* Tags */}
          {thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {thread.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>{thread._count.upvotes} upvotes</span>
            <span>{thread._count.comments} comments</span>
          </div>
        </div>

                        {/* Full Conversation with Contributions */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Full Conversation</h3>
          
          {/* Original Thread */}
          <div className="bg-blue-50/30 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                {thread.author.name?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="text-sm font-medium text-blue-700">
                Original by {thread.author.name || "Anonymous"}
              </span>
            </div>
            {formatContent(thread.content, true)}
          </div>

          {/* Contributions */}
          {thread.contributions && thread.contributions.length > 0 && (
            <div className="space-y-4">
              {thread.contributions.map((contribution, index) => {
                // Different background colors for different contributors
                const colors = [
                  'bg-green-50/30 border-green-200 text-green-700',
                  'bg-purple-50/30 border-purple-200 text-purple-700', 
                  'bg-orange-50/30 border-orange-200 text-orange-700',
                  'bg-pink-50/30 border-pink-200 text-pink-700',
                  'bg-indigo-50/30 border-indigo-200 text-indigo-700'
                ];
                const colorClass = colors[index % colors.length];
                const [bgColor, borderColor, textColor] = colorClass.split(' ');

                                        return (
                          <div 
                            key={contribution.id} 
                            className={`${bgColor} border ${borderColor} rounded-lg p-6`}
                            ref={index === thread.contributions.length - 1 ? conversationRef : null}
                          >
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-6 h-6 rounded-full ${borderColor.replace('border-', 'bg-').replace('-200', '-500')} flex items-center justify-center text-white text-xs font-medium`}>
                        {contribution.author.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${textColor}`}>
                          Contribution by {contribution.author.name || "Anonymous"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {contribution.source}
                        </Badge>
                      </div>
                    </div>
                    {formatContent(contribution.content, true)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Button variant="outline" onClick={handleContributeClick}>
            Contribute to This Conversation
          </Button>
          <Button variant="outline" onClick={handleExportClick}>
            📤 Export Chat
          </Button>
          <Button 
            variant={hasUpvoted ? "default" : "outline"}
            onClick={() => handleVote('upvote')}
            disabled={voteLoading}
            title={hasUpvoted ? "Click to remove your upvote" : "Click to upvote this conversation"}
          >
            👍 {hasUpvoted ? "Upvoted" : "Upvote"} ({upvoteCount})
          </Button>
          <Button 
            variant={hasDownvoted ? "destructive" : "outline"}
            onClick={() => handleVote('downvote')}
            disabled={voteLoading}
            title={hasDownvoted ? "Click to remove your downvote" : "Click to downvote this conversation"}
          >
            👎 {hasDownvoted ? "Downvoted" : "Downvote"} ({downvoteCount})
          </Button>
        </div>



        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑ Back to Top
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">← Back to Feed</Link>
          </Button>
        </div>

        {/* Enhanced Reference Modal */}
        {console.log('🔍 Rendering modal check:', { showReferenceModal, selectedText, selectedSource })}
        {showReferenceModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border"
              style={{ 
                position: 'relative',
                zIndex: 10000,
                backgroundColor: 'white',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Selected Text</h3>
              
              {/* Selected text display */}
              <div className="bg-gray-100 p-3 rounded mb-4 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1 font-medium">
                  {selectedSource}:
                </div>
                <div className="text-sm text-gray-900 font-mono bg-white p-2 rounded border">
                  "{selectedText}"
                </div>
              </div>

              {/* Like/Dislike buttons */}
              <div className="flex gap-2 mb-4 justify-center">
                <Button
                  variant={textSegmentVotes[`${selectedText.slice(0, 50)}...`] === 'like' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTextSegmentVote(selectedText, 'like')}
                  className="flex items-center gap-1"
                >
                  👍 Like
                </Button>
                <Button
                  variant={textSegmentVotes[`${selectedText.slice(0, 50)}...`] === 'dislike' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => handleTextSegmentVote(selectedText, 'dislike')}
                  className="flex items-center gap-1"
                >
                  👎 Dislike
                </Button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    // Navigate to contribute page with reference
                    window.location.href = `/contribute/${thread.id}?ref=${encodeURIComponent(selectedText)}&source=${selectedSource}`;
                  }}
                  className="flex-1"
                >
                  💬 Reply to this
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReferenceModal(false);
                    setSelectedText("");
                    setSelectedSource("");
                    // Clear browser selection to allow new selections
                    window.getSelection()?.removeAllRanges();
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Export Conversation</h3>
              <p className="text-muted-foreground mb-4">
                Choose the format for your export. This will include the original conversation and all community contributions.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Export Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Plain Text (.txt)</SelectItem>
                      <SelectItem value="markdown">Markdown (.md)</SelectItem>
                      <SelectItem value="json">JSON (.json)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p><strong>Plain Text:</strong> Human-readable format, great for copying into other AI tools</p>
                  <p><strong>Markdown:</strong> Formatted text with headers and styling</p>
                  <p><strong>JSON:</strong> Structured data format for developers</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={handleExport} 
                  disabled={isExporting}
                  className="flex-1"
                >
                  {isExporting ? "Exporting..." : "📤 Export"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowExportModal(false)}
                  disabled={isExporting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Waitlist Modal */}
        <WaitlistModal 
          isOpen={showWaitlist} 
          onClose={() => setShowWaitlist(false)} 
        />

        <AILoadingModal isLoading={loading} />
      </div>
    </main>
  );
}
