"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { BookmarkletModal } from "@/components/bookmarklet/bookmarklet-modal";
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
  _count: {
    comments: number;
    upvotes: number;
    downvotes: number;
  };
}

export default function HomePage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showBookmarkletModal, setShowBookmarkletModal] = useState(false);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [isChangingView, setIsChangingView] = useState(false);
  const { user } = useSupabase();

  // Simple cache for faster switching
  const [threadCache, setThreadCache] = useState<Map<string, Thread[]>>(new Map());



  useEffect(() => {
    fetchThreads();
  }, [showFollowingOnly, sortBy]);

  // Prefetch both sort options on mount for faster switching
  useEffect(() => {
    if (threads.length === 0) return; // Only prefetch after initial load
    
    const prefetchOtherSort = async () => {
      const otherSort = sortBy === 'latest' ? 'popular' : 'latest';
      const params = new URLSearchParams();
      if (showFollowingOnly) params.append('following', 'true');
      params.append('sort', otherSort);
      
      try {
        // Prefetch in background - don't await or handle errors
        fetch(`/api/threads?${params.toString()}`);
      } catch {
        // Silently fail prefetch
      }
    };
    
    // Prefetch after a short delay
    const timer = setTimeout(prefetchOtherSort, 2000);
    return () => clearTimeout(timer);
  }, [threads.length, sortBy, showFollowingOnly]);

  // Handle successful post redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('posted') === 'true') {
      // Clear cache and force refresh threads to show new post
      setThreadCache(new Map());
      fetchThreads();
      // Clean up the URL parameters
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const fetchThreads = async () => {
    try {
      setIsChangingView(true);
      const params = new URLSearchParams();
      if (showFollowingOnly) params.append('following', 'true');
      if (sortBy) params.append('sort', sortBy);
      
      const cacheKey = params.toString();
      
      // Check cache first for instant loading
      if (threadCache.has(cacheKey)) {
        const cachedData = threadCache.get(cacheKey)!;
        setThreads(cachedData);
        setIsChangingView(false);
        setLoading(false);
        console.log('✅ Loaded from cache:', cacheKey);
        return;
      }
      
      const url = `/api/threads?${params.toString()}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const safe = Array.isArray(data)
          ? data.map((t: any) => ({
              ...t,
              tags: Array.isArray(t?.tags) ? t.tags : [],
              _count: t?._count || { comments: 0, upvotes: 0, downvotes: 0 },
              author: t?.author || { id: '', name: null, avatarUrl: null },
            }))
          : [];
        
        // Update cache
        setThreadCache(prev => new Map(prev.set(cacheKey, safe)));
        setThreads(safe);
        console.log('✅ Loaded from API and cached:', cacheKey);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
      setIsChangingView(false);
    }
  };

  const shareOnX = (thread: Thread) => {
    const url = `https://www.vanwinkleapp.com/thread/${thread.id}`;
    const text = `Check out this AI conversation: "${thread.title || thread.summary}"\n\n${url}\n\n#AI #vanwinkle`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, '_blank');
  };

  const copyThreadLink = async (threadId: string) => {
    const url = `https://www.vanwinkleapp.com/thread/${threadId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  // Get all unique tags from threads (guard against missing tags)
  const allTags = Array.from(new Set(threads.flatMap(thread => thread.tags || []))).slice(0, 10);

  // Filter threads by selected tag (sorting is now handled by API)
  const filteredThreads = selectedTag 
    ? threads.filter(thread => thread.tags?.includes(selectedTag))
    : threads;

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
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <main className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img src="/vanwinkle_logo.png" alt="vanwinkle" className="h-16 w-auto" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share and discover interesting conversations with AI. Submit your best ChatGPT, Claude, and other AI interactions for the community to explore.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button asChild size="lg">
              <Link href="/submit">Submit Conversation</Link>
            </Button>
            <Button 
              onClick={() => setShowBookmarkletModal(true)} 
              variant="outline" 
              size="lg"
              className="flex items-center gap-2"
            >
              🚀 Install Bookmarklet
            </Button>
          </div>
          

        </div>



        {/* View and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
          {/* Following Filter */}
          {user && (
            <div className="space-y-2">
              <div className="text-sm font-medium">View:</div>
              <div className="flex gap-2">
                <Button
                  variant={!showFollowingOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFollowingOnly(false)}
                  disabled={isChangingView}
                  className={isChangingView && !showFollowingOnly ? "opacity-50 animate-pulse" : ""}
                >
                  All Posts
                </Button>
                <Button
                  variant={showFollowingOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFollowingOnly(true)}
                  disabled={isChangingView}
                  className={isChangingView && showFollowingOnly ? "opacity-50 animate-pulse" : ""}
                >
                  Following Only
                </Button>
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Sort by:</div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'latest' ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy('latest')}
                disabled={isChangingView}
                className={isChangingView && sortBy === 'latest' ? "opacity-50 animate-pulse" : ""}
              >
                Latest Activity
              </Button>
              <Button
                variant={sortBy === 'popular' ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy('popular')}
                disabled={isChangingView}
                className={isChangingView && sortBy === 'popular' ? "opacity-50 animate-pulse" : ""}
              >
                Popular
              </Button>
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
          <div className="space-y-4 threads-feed">
            {filteredThreads.map((thread, index) => (
              <div key={thread.id} className={`border rounded-lg p-6 hover:bg-muted/50 transition-colors thread-item ${index === 0 ? 'first-thread' : ''}`}>
                <div className="space-y-3">
                  {/* Thread Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${thread.author.id}`} className="flex items-center gap-3 hover:opacity-80">
                        {thread.author.avatarUrl ? (
                          <img 
                            src={thread.author.avatarUrl} 
                            alt="Author avatar" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {thread.author.name?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          by {thread.author.name || "Anonymous"} • {formatDate(thread.createdAt)}
                          {thread.source && (
                            <>
                              {" • "}
                              <Badge variant="secondary">{thread.source}</Badge>
                            </>
                          )}
                        </div>
                      </Link>
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
                  {(thread.tags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(thread.tags || []).map((tag) => (
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
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/thread/${thread.id}`}>Read Full</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/contribute/${thread.id}`}>Contribute</Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => shareOnX(thread)}
                      >
                        𝕏 Share
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyThreadLink(thread.id)}
                      >
                        📋 Copy Link
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarklet Modal */}
      <BookmarkletModal 
        isOpen={showBookmarkletModal} 
        onClose={() => setShowBookmarkletModal(false)} 
      />

      <AILoadingModal isLoading={loading} />
    </main>
  );
}
