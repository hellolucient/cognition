"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";

interface InlineCommentProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    isCollapsed: boolean;
    author: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    };
    textSegmentVotes: Array<{
      voteType: string;
      userId: string;
    }>;
  };
  onToggleCollapse: (commentId: string, newState: boolean) => void;
  onVote: (commentId: string, voteType: 'like' | 'dislike') => void;
  currentUserVote?: 'like' | 'dislike' | null;
}

export function InlineComment({ 
  comment, 
  onToggleCollapse, 
  onVote,
  currentUserVote 
}: InlineCommentProps) {
  const { user } = useSupabase();
  const [isVoting, setIsVoting] = useState(false);

  const likeCount = comment.textSegmentVotes.filter(v => v.voteType === 'like').length;
  const dislikeCount = comment.textSegmentVotes.filter(v => v.voteType === 'dislike').length;
  const isAuthor = user?.id === comment.author.id;

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!user) return;
    
    setIsVoting(true);
    try {
      await onVote(comment.id, voteType);
    } finally {
      setIsVoting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 my-2">
      {/* Comment Header */}
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-blue-100"
          onClick={() => onToggleCollapse(comment.id, !comment.isCollapsed)}
        >
          {comment.isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex items-center gap-2 text-sm">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
            {comment.author.name?.[0]?.toUpperCase() || "?"}
          </div>
          <span className="font-medium text-blue-700">
            {comment.author.name || "Anonymous"}
          </span>
          <span className="text-gray-500 text-xs">
            {formatDate(comment.createdAt)}
          </span>
          {isAuthor && (
            <Badge variant="secondary" className="text-xs">
              You
            </Badge>
          )}
        </div>
      </div>

      {/* Comment Content */}
      {!comment.isCollapsed && (
        <div className="ml-8 mb-3">
          <div className="text-gray-800 text-sm leading-relaxed">
            {comment.content}
          </div>
        </div>
      )}

      {/* Inline Voting */}
      <div className="flex items-center gap-2 ml-8">
        <Button
          variant={currentUserVote === 'like' ? 'default' : 'outline'}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => handleVote('like')}
          disabled={isVoting || !user}
        >
          <ThumbsUp className="h-3 w-3 mr-1" />
          {likeCount}
        </Button>
        
        <Button
          variant={currentUserVote === 'dislike' ? 'destructive' : 'outline'}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => handleVote('dislike')}
          disabled={isVoting || !user}
        >
          <ThumbsDown className="h-3 w-3 mr-1" />
          {dislikeCount}
        </Button>

        <div className="text-xs text-gray-500 ml-2">
          {comment.isCollapsed ? 'Click to expand' : 'Click to collapse'}
        </div>
      </div>
    </div>
  );
}
