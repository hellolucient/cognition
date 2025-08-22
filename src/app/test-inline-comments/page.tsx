"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineComment } from "@/components/ui/inline-comment";
import { InlineCommentModal } from "@/components/ui/inline-comment-modal";
import Link from "next/link";

export default function TestInlineCommentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedText, setSelectedText] = useState("This is a sample text selection for testing inline comments.");
  const [selectedSource, setSelectedSource] = useState("Test");
  const [comments, setComments] = useState([
    {
      id: "1",
      content: "This is a great point about AI development! I think it really highlights the importance of ethical considerations.",
      createdAt: new Date().toISOString(),
      isCollapsed: true,
      author: {
        id: "user1",
        name: "Alice",
        avatarUrl: null,
      },
      textSegmentVotes: [
        { voteType: "like", userId: "user1" },
        { voteType: "like", userId: "user2" },
        { voteType: "dislike", userId: "user3" },
      ],
    },
    {
      id: "2",
      content: "I disagree with this perspective. The current approach has significant limitations that aren't being addressed.",
      createdAt: new Date().toISOString(),
      isCollapsed: false,
      author: {
        id: "user2",
        name: "Bob",
        avatarUrl: null,
      },
      textSegmentVotes: [
        { voteType: "dislike", userId: "user1" },
        { voteType: "like", userId: "user2" },
      ],
    },
  ]);

  const handleToggleCollapse = (commentId: string, newState: boolean) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, isCollapsed: newState }
          : comment
      )
    );
  };

  const handleVote = (commentId: string, voteType: 'like' | 'dislike') => {
    console.log('Vote:', commentId, voteType);
    // In a real app, this would call the API
  };

  const handleAddComment = async (content: string) => {
    const newComment = {
      id: Date.now().toString(),
      content,
      createdAt: new Date().toISOString(),
      isCollapsed: false,
      author: {
        id: "currentUser",
        name: "You",
        avatarUrl: null,
      },
      textSegmentVotes: [],
    };
    
    setComments(prev => [...prev, newComment]);
    setShowModal(false);
  };

  return (
    <main className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <Button variant="outline" asChild className="mb-4">
            <Link href="/">← Back to Feed</Link>
          </Button>
          <h1 className="text-3xl font-bold">Inline Comments Test</h1>
          <p className="text-muted-foreground">
            Test the new inline comment functionality with collapsible comments and inline voting.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded border">
          <h2 className="text-lg font-medium mb-4">Sample Content</h2>
          <div className="space-y-4">
            <p className="text-gray-800 leading-relaxed">
              This is a sample conversation about artificial intelligence and its impact on society. 
              The rapid advancement of AI technology has raised important questions about ethics, 
              privacy, and the future of work.
            </p>
            
            <p className="text-gray-800 leading-relaxed">
              Many experts believe that AI will fundamentally transform how we live and work. 
              However, there are also concerns about job displacement and the concentration of 
              power in the hands of a few technology companies.
            </p>

            <p className="text-gray-800 leading-relaxed">
              The key challenge is finding the right balance between innovation and regulation. 
              We need to ensure that AI benefits everyone, not just those who can afford it.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded border">
          <h3 className="text-lg font-medium mb-4 text-blue-900">Inline Comments Demo</h3>
          <p className="text-blue-800 mb-4">
            Below are sample inline comments that demonstrate the new functionality:
          </p>
          
          <div className="space-y-4">
            {comments.map(comment => (
              <InlineComment
                key={comment.id}
                comment={comment}
                onToggleCollapse={handleToggleCollapse}
                onVote={handleVote}
                currentUserVote={comment.textSegmentVotes.find(v => v.userId === "currentUser")?.voteType as 'like' | 'dislike' | null}
              />
            ))}
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded border">
          <h3 className="text-lg font-medium mb-4 text-green-900">Test Adding Comments</h3>
          <p className="text-green-800 mb-4">
            Click the button below to test adding a new inline comment:
          </p>
          
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Add Test Comment
          </Button>
        </div>

        <div className="bg-purple-50 p-6 rounded border">
          <h3 className="text-lg font-medium mb-4 text-purple-900">Features Demonstrated</h3>
          <ul className="text-purple-800 space-y-2">
            <li>✅ <strong>Collapsible Comments:</strong> Click the chevron to expand/collapse</li>
            <li>✅ <strong>Inline Voting:</strong> Thumbs up/down buttons for each comment</li>
            <li>✅ <strong>Author Identification:</strong> Shows who wrote each comment</li>
            <li>✅ <strong>Vote Counts:</strong> Displays total likes and dislikes</li>
            <li>✅ <strong>Collapse State:</strong> New comments are expanded by default for the author</li>
            <li>✅ <strong>Responsive Design:</strong> Works on all screen sizes</li>
          </ul>
        </div>
      </div>

      {/* Inline Comment Modal */}
      <InlineCommentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedText={selectedText}
        selectedSource={selectedSource}
        onSubmit={handleAddComment}
        isSubmitting={false}
      />
    </main>
  );
}
