"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";

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
  _count: {
    comments: number;
    upvotes: number;
  };
}

export default function HomePage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { user } = useSupabase();

  const [bookmarkletUrl, setBookmarkletUrl] = useState('');

  // Set up bookmarklet using DOM manipulation to bypass React security
  useEffect(() => {
    const button = document.getElementById('bookmarklet-button');
    if (button) {
      const bookmarkletCode = `(function(){try{console.log('=== VANWINKLE BOOKMARKLET v2 DEBUG ===');console.log('URL:',window.location.href);console.log('Document ready state:',document.readyState);var messages=Array.from(document.querySelectorAll('main .min-h-\\\\[20px\\\\], main .prose')).map(function(el){return el.innerText;});console.log('Found messages:',messages.length);if(messages.length>0){console.log('First message preview:',messages[0].substring(0,100));}if(messages.length===0){alert('❌ No messages found.\\\\n\\\\nFound selectors: '+document.querySelectorAll('main .min-h-\\\\[20px\\\\], main .prose').length+'\\\\nTry a different ChatGPT page.');return;}var formatted=messages.map(function(text,i){return i%2===0?'🧑 You:\\\\n'+text:'🤖 ChatGPT:\\\\n'+text;}).join('\\\\n\\\\n---\\\\n\\\\n');console.log('Formatted length:',formatted.length);console.log('Clipboard available:',!!navigator.clipboard);console.log('writeText available:',!!(navigator.clipboard&&navigator.clipboard.writeText));setTimeout(function(){if(navigator.clipboard&&navigator.clipboard.writeText){console.log('🔄 Attempting clipboard write...');navigator.clipboard.writeText(formatted).then(function(){console.log('✅ SUCCESS: Clipboard write completed');console.log('Opening Vanwinkle...');window.open('http://localhost:3002/submit?from=bookmarklet','_blank');alert('✅ SUCCESS!\\\\n\\\\nCopied '+formatted.length+' characters to clipboard.\\\\n\\\\nVanwinkle is opening - click \\"Paste from Clipboard\\"');}).catch(function(err){console.error('❌ CLIPBOARD FAILED:',err);console.log('Error name:',err.name);console.log('Error message:',err.message);alert('❌ CLIPBOARD FAILED\\\\n\\\\nError: '+err.message+'\\\\n\\\\nTry clicking the page first, then run bookmarklet again.');});}else{console.log('❌ No clipboard support');alert('❌ No clipboard support in this browser');}},500);}catch(e){console.error('BOOKMARKLET ERROR:',e);alert('❌ BOOKMARKLET ERROR\\\\n\\\\n'+e.message);}})();`;
      
      // Create an actual anchor element and set its href
      const link = document.createElement('a');
      link.href = `javascript:${bookmarkletCode}`;
      link.innerHTML = button.innerHTML;
      link.className = button.className;
      link.draggable = true;
      
      // Replace the div with the anchor
      button.parentNode?.replaceChild(link, button);
      
      setBookmarkletUrl(`javascript:${bookmarkletCode}`);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/threads');
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags from threads
  const allTags = Array.from(new Set(threads.flatMap(thread => thread.tags))).slice(0, 10);

  // Filter threads by selected tag
  const filteredThreads = selectedTag 
    ? threads.filter(thread => thread.tags.includes(selectedTag))
    : threads;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  return (
    <main className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img src="/vanwinkle_logo.png" alt="Vanwinkle" className="h-16 w-auto" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share and discover interesting conversations with AI. Submit your best ChatGPT, Claude, and other AI interactions for the community to explore.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/submit">Submit Conversation</Link>
            </Button>
            {user && (
              <Button variant="outline" asChild>
                <Link href="/settings">Settings</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Bookmarklet Installation Hero */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🚀</span>
              <h2 className="text-2xl font-bold text-blue-900">Get Started in 10 Seconds</h2>
            </div>
            
            <p className="text-blue-800 max-w-2xl mx-auto">
              Install our bookmarklet to instantly share your ChatGPT, Claude, or other AI conversations with the community.
            </p>
            
            <div className="bg-white/80 backdrop-blur-sm border border-blue-300 rounded-lg p-4 max-w-3xl mx-auto">
              <div className="space-y-3">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  Step 1: Drag this button to your bookmarks bar ↓
                </div>
                
                <div className="flex justify-center">
                  <div
                    id="bookmarklet-button"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors cursor-grab active:cursor-grabbing select-none"
                    draggable="true"
                  >
                    📋 Save to Vanwinkle
                  </div>
                </div>
                
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>Step 2:</strong> Go to a ChatGPT conversation or share page</p>
                  <p><strong>Step 3:</strong> Click anywhere on the page first, then click the bookmark</p>
                  <p className="text-green-600"><strong>✨ Auto-copies to clipboard + opens Vanwinkle</strong></p>
                  <p className="text-blue-600"><strong>💡 Mac app users:</strong> Share → Open in browser → Use bookmarklet</p>
                  <p className="text-orange-600"><strong>📁 Fallback:</strong> Downloads file if clipboard fails</p>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-blue-600 space-y-2">
              <p>💡 <strong>Can&apos;t drag?</strong> Right-click the button above → &quot;Bookmark this link&quot; or &quot;Add to bookmarks&quot;</p>
              <details className="cursor-pointer">
                <summary className="font-medium">🔧 Alternative: Manual Setup</summary>
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <p className="mb-2">1. Copy this code:</p>
                  <textarea 
                    readOnly 
                    value={bookmarkletUrl}
                    className="w-full h-20 text-xs font-mono p-1 border rounded"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <p className="mt-2">2. Create a new bookmark and paste as the URL</p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Filter by tag:</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Threads Feed */}
        {loading ? (
          <div className="text-center py-8">Loading conversations...</div>
        ) : filteredThreads.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <h2 className="text-lg font-medium mb-2">
              {selectedTag ? `No conversations tagged "${selectedTag}"` : "No conversations yet"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {selectedTag ? "Try a different tag or" : "Be the first to"} share an interesting AI conversation!
            </p>
            <Button asChild>
              <Link href="/submit">Get Started</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredThreads.map((thread) => (
              <div key={thread.id} className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                <div className="space-y-3">
                  {/* Thread Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {thread.author.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        by {thread.author.name || "Anonymous"} • {formatDate(thread.createdAt)}
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
                      <h3 className="text-lg font-semibold text-foreground mb-2">{thread.title}</h3>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-2">
                    <p className="text-foreground leading-relaxed">{thread.summary}</p>
                  </div>

                  {/* Tags */}
                  {thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {thread.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="text-xs cursor-pointer hover:bg-muted"
                          onClick={() => setSelectedTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Thread Stats & Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{thread._count.upvotes} upvotes</span>
                      <span>{thread._count.comments} comments</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/thread/${thread.id}`}>Read Full</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/contribute/${thread.id}`}>Contribute</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
