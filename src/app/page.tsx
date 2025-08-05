"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect } from "react";
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
          <h1 className="text-4xl font-bold tracking-tight">cognition</h1>
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
