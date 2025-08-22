"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, MessageSquare, ThumbsUp, ThumbsDown, Bot, User } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";

interface InlineContributionProps {
  contribution: {
    id: string;
    content: string;
    createdAt: string;
    isCollapsed: boolean;
    contributionType: string;
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
  onToggleCollapse: (contributionId: string, newState: boolean) => void;
  onVote: (contributionId: string, voteType: 'like' | 'dislike') => void;
  currentUserVote?: 'like' | 'dislike' | null;
}

export function InlineContribution({ 
  contribution, 
  onToggleCollapse, 
  onVote,
  currentUserVote 
}: InlineContributionProps) {
  const { user } = useSupabase();
  const [isVoting, setIsVoting] = useState(false);

  const likeCount = contribution.textSegmentVotes.filter(v => v.voteType === 'like').length;
  const dislikeCount = contribution.textSegmentVotes.filter(v => v.voteType === 'dislike').length;
  const isAuthor = user?.id === contribution.author.id;
  const isAI = contribution.contributionType === 'ai';

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!user) return;
    
    setIsVoting(true);
    try {
      await onVote(contribution.id, voteType);
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

  const getContributionIcon = () => {
    if (isAI) {
      return <Bot className="h-4 w-4 text-blue-500" />;
    }
    return <User className="h-4 w-4 text-green-500" />;
  };

  const getContributionTypeLabel = () => {
    if (isAI) {
      return "AI Response";
    }
    return "Manual Contribution";
  };

  const getContributionTypeColor = () => {
    if (isAI) {
      return "bg-blue-50/50 border-blue-200";
    }
    return "bg-green-50/50 border-green-200";
  };

  return (
    <div className={`${getContributionTypeColor()} border rounded-lg p-3 my-2`}>
      {/* Contribution Header */}
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-blue-100"
          onClick={() => onToggleCollapse(contribution.id, !contribution.isCollapsed)}
        >
          {contribution.isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex items-center gap-2 text-sm">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
            {contribution.author.name?.[0]?.toUpperCase() || "?"}
          </div>
          <span className="font-medium text-blue-700">
            {contribution.author.name || "Anonymous"}
          </span>
          <span className="text-gray-500 text-xs">
            {formatDate(contribution.createdAt)}
          </span>
          {isAuthor && (
            <Badge variant="secondary" className="text-xs">
              You
            </Badge>
          )}
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            {getContributionIcon()}
            {getContributionTypeLabel()}
          </Badge>
        </div>
      </div>

      {/* Contribution Content */}
      {!contribution.isCollapsed && (
        <div className="ml-8 mb-3">
          <div className="text-gray-800 text-sm leading-relaxed">
            {contribution.content}
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
          {contribution.isCollapsed ? 'Click to expand' : 'Click to collapse'}
        </div>
      </div>
    </div>
  );
}
