"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSupabase } from "@/components/providers/supabase-provider";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  createdAt: string;
  stats: {
    threads: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

interface Thread {
  id: string;
  title: string | null;
  summary: string;
  source: string | null;
  tags: string[];
  createdAt: string;
  _count: {
    upvotes: number;
    contributions: number;
  };
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user: currentUser } = useSupabase();
  
  const [profile, setProfile] = useState<User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    website: "",
    location: "",
  });

  useEffect(() => {
    fetchProfile();
  }, [resolvedParams.id]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setThreads(data.recentThreads);
        setIsOwnProfile(data.isOwnProfile);
        setIsFollowing(data.user.isFollowing || false);
        
        // Initialize edit form
        setEditForm({
          name: data.user.name || "",
          bio: data.user.bio || "",
          website: data.user.website || "",
          location: data.user.location || "",
        });
      } else {
        setError('User not found');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return;
    
    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${resolvedParams.id}/follow`, {
        method,
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.following);
        // Update follower count
        if (profile) {
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followers: data.followersCount,
            }
          });
        }
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`/api/users/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, ...data.user } : null);
        setIsEditing(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Failed to update profile');
    }
  };

  const handleAvatarUpdate = (avatarUrl: string | null) => {
    setProfile(prev => prev ? { ...prev, avatarUrl } : null);
    setShowAvatarUpload(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <main className="container mx-auto py-8 max-w-4xl">
        <div className="text-center">Loading profile...</div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="container mx-auto py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button asChild>
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="outline" asChild>
          <Link href="/">← Back to Feed</Link>
        </Button>

        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative group">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name || 'User avatar'}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-2xl text-muted-foreground">
                        {profile.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowAvatarUpload(true)}
                      className="absolute inset-0 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-2">
                {isEditing ? (
                  <div className="space-y-4">
                    <Input
                      placeholder="Display name"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Bio (optional)"
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                    />
                    <Input
                      placeholder="Website (optional)"
                      value={editForm.website}
                      onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                    />
                    <Input
                      placeholder="Location (optional)"
                      value={editForm.location}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile}>Save Changes</Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <h1 className="text-3xl font-bold">{profile.name || 'Anonymous User'}</h1>
                      {isOwnProfile ? (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                          Edit Profile
                        </Button>
                      ) : currentUser ? (
                        <Button 
                          variant={isFollowing ? "outline" : "default"}
                          onClick={handleFollow}
                          disabled={followLoading}
                        >
                          {followLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                        </Button>
                      ) : null}
                    </div>

                    {profile.bio && (
                      <p className="text-muted-foreground">{profile.bio}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {profile.location && (
                        <span>📍 {profile.location}</span>
                      )}
                      {profile.website && (
                        <a 
                          href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          🔗 Website
                        </a>
                      )}
                      <span>📅 Joined {formatDate(profile.createdAt)}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 pt-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{profile.stats.threads}</div>
                        <div className="text-sm text-muted-foreground">Posts</div>
                      </div>
                      <Link href={`/profile/${profile.id}/followers`} className="text-center hover:bg-muted/50 p-2 rounded">
                        <div className="text-2xl font-bold">{profile.stats.followers}</div>
                        <div className="text-sm text-muted-foreground">Followers</div>
                      </Link>
                      <Link href={`/profile/${profile.id}/following`} className="text-center hover:bg-muted/50 p-2 rounded">
                        <div className="text-2xl font-bold">{profile.stats.following}</div>
                        <div className="text-sm text-muted-foreground">Following</div>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>
              Latest AI conversations shared by {profile.name || 'this user'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {threads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No posts yet
              </p>
            ) : (
              <div className="space-y-4">
                {threads.map((thread) => (
                  <div key={thread.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium line-clamp-2">
                          {thread.title || thread.summary}
                        </h3>
                        <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {thread.summary}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {thread.source && (
                            <Badge variant="secondary">{thread.source}</Badge>
                          )}
                          {thread.tags.map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {thread._count.upvotes} upvotes
                          </span>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/thread/${thread.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Avatar Upload Modal */}
        {showAvatarUpload && isOwnProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Update Avatar</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAvatarUpload(false)}
                  >
                    ✕
                  </Button>
                </div>
                
                <AvatarUpload
                  currentAvatar={profile.avatarUrl}
                  userId={resolvedParams.id}
                  onAvatarUpdate={handleAvatarUpdate}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
