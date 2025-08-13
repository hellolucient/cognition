"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/components/providers/supabase-provider";
import { AILoadingModal } from "@/components/ui/ai-loading-modal";
import Link from "next/link";

interface UserFollowInfo {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followedAt: string;
  isFollowing?: boolean;
}

export default function FollowingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user: currentUser } = useSupabase();
  
  const [following, setFollowing] = useState<UserFollowInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    fetchFollowing();
  }, [resolvedParams.id]);

  const fetchFollowing = async () => {
    try {
      const response = await fetch(`/api/users/${resolvedParams.id}/following`);
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following);
        setProfileName(data.profileName);
      } else {
        setError('Failed to load following list');
      }
    } catch (error) {
      console.error('Error fetching following:', error);
      setError('Failed to load following list');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) return;
    
    try {
      const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method,
      });
      
      if (response.ok) {
        // Update the local state
        setFollowing(prev => prev.map(user => 
          user.id === targetUserId 
            ? { ...user, isFollowing: !isCurrentlyFollowing }
            : user
        ));
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto py-8 max-w-4xl">
        <div className="text-center">Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto py-8 max-w-4xl">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button asChild>
            <Link href={`/profile/${resolvedParams.id}`}>← Back to Profile</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href={`/profile/${resolvedParams.id}`}>← Back to Profile</Link>
          </Button>
          <h1 className="text-2xl font-bold">
            Following ({following.length})
          </h1>
        </div>

        {/* Following List */}
        <Card>
          <CardHeader>
            <CardTitle>People {profileName || 'This user'} follows</CardTitle>
            <CardDescription>
              Users that {profileName || 'this user'} is following
            </CardDescription>
          </CardHeader>
          <CardContent>
            {following.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No following anyone yet
              </div>
            ) : (
              <div className="space-y-4">
                {following.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Link href={`/profile/${user.id}`} className="flex items-center gap-4 hover:opacity-80">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name || 'User avatar'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-lg text-muted-foreground">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{user.name || 'Anonymous User'}</h3>
                          {user.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Following since {new Date(user.followedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    </div>
                    
                    {currentUser && currentUser.id !== user.id && (
                      <Button
                        variant={user.isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleFollow(user.id, user.isFollowing || false)}
                      >
                        {user.isFollowing ? 'Unfollow' : 'Follow'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <AILoadingModal isLoading={loading} />
    </main>
  );
}
