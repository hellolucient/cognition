"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { BookmarkletModal } from "@/components/bookmarklet/bookmarklet-modal";

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
  const { user } = useSupabase();



  useEffect(() => {
    fetchThreads();
  }, []);

  // Auto-scroll to threads section when redirected from successful post
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('posted') === 'true' && threads.length > 0) {
      // Small delay to ensure content is rendered, then scroll to threads section
      setTimeout(() => {
        const threadsSection = document.querySelector('.threads-feed');
        if (threadsSection) {
          // Scroll to the threads section, not the very top of the page
          threadsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Clean up the URL parameter
        window.history.replaceState({}, '', '/');
      }, 800);
    }
  }, [threads]); // Trigger when threads load

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

  // Filter threads by selected tag and sort by net upvotes (upvotes - downvotes)
  const filteredThreads = (selectedTag 
    ? threads.filter(thread => thread.tags.includes(selectedTag))
    : threads)
    .sort((a, b) => {
      const aNetVotes = a._count.upvotes - a._count.downvotes;
      const bNetVotes = b._count.upvotes - b._count.downvotes;
      return bNetVotes - aNetVotes; // Highest net votes first
    });

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

      {/* Bookmarklet Modal */}
      <BookmarkletModal 
        isOpen={showBookmarkletModal} 
        onClose={() => setShowBookmarkletModal(false)} 
      />
    </main>
  );
}
