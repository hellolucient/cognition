"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DemoTextSelectionPage() {
  const [selectedText, setSelectedText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [votes, setVotes] = useState<{[key: string]: 'like' | 'dislike' | null}>({});

  // Set up text selection listener
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 5) {
        console.log('✅ Text selected:', selectedText);
        setSelectedText(selectedText);
        setShowModal(true);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const handleVote = (text: string, voteType: 'like' | 'dislike') => {
    const segmentKey = `${text.slice(0, 50)}...`;
    const currentVote = votes[segmentKey];
    const newVote = currentVote === voteType ? null : voteType;
    
    setVotes(prev => ({
      ...prev,
      [segmentKey]: newVote
    }));
  };

  const getVoteIndicator = (text: string) => {
    const segmentKey = `${text.slice(0, 50)}...`;
    const vote = votes[segmentKey];
    if (vote === 'like') return '👍';
    if (vote === 'dislike') return '👎';
    return '';
  };

  const sampleTexts = [
    "This is a sample conversation between a human and an AI assistant. Try selecting any part of this text to see the immediate popup modal in action!",
    "The AI responds with helpful and detailed information about various topics. You can select specific parts of responses to give feedback or reply to them directly.",
    "This new text selection system works much better than the old click-based approach. It feels more natural and responsive, just like modern text editors and chat applications."
  ];

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Text Selection Demo</h1>
          <p className="text-muted-foreground">
            Select any text below to see the immediate popup modal with like/dislike functionality.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">How to test:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
            <li>Select any text in the conversation below</li>
            <li>Modal should appear immediately (no clicking required)</li>
            <li>Use like/dislike buttons to vote on text segments</li>
            <li>Vote indicators appear next to voted text</li>
            <li>Click "Close" or select different text to continue</li>
          </ol>
        </div>

        {/* Sample conversation */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Sample Conversation</h2>
          
          <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
            <div className="text-sm font-medium text-blue-700 mb-1">Human</div>
            <div 
              className="text-gray-800 select-text cursor-text relative"
              data-source="Human"
            >
              {sampleTexts[0]}
              {getVoteIndicator(sampleTexts[0]) && (
                <span className="absolute -right-2 -top-2">
                  {getVoteIndicator(sampleTexts[0])}
                </span>
              )}
            </div>
          </div>

          <div className="mb-4 p-4 bg-gray-50 border-l-4 border-gray-500 rounded-r">
            <div className="text-sm font-medium text-gray-700 mb-1">Assistant</div>
            <div 
              className="text-gray-800 select-text cursor-text relative"
              data-source="Assistant"
            >
              {sampleTexts[1]}
              {getVoteIndicator(sampleTexts[1]) && (
                <span className="absolute -right-2 -top-2">
                  {getVoteIndicator(sampleTexts[1])}
                </span>
              )}
            </div>
          </div>

          <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
            <div className="text-sm font-medium text-blue-700 mb-1">Human</div>
            <div 
              className="text-gray-800 select-text cursor-text relative"
              data-source="Human"
            >
              {sampleTexts[2]}
              {getVoteIndicator(sampleTexts[2]) && (
                <span className="absolute -right-2 -top-2">
                  {getVoteIndicator(sampleTexts[2])}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Vote status */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Current Votes:</h3>
          {Object.entries(votes).length === 0 ? (
            <p className="text-sm text-muted-foreground">No votes yet. Select some text and vote!</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(votes).map(([key, vote]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium">{vote === 'like' ? '👍' : '👎'}</span>
                  <span className="ml-2 text-muted-foreground">{key}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Selected Text</h3>
            
            <div className="bg-muted p-3 rounded mb-4">
              <div className="text-sm">
                "{selectedText}"
              </div>
            </div>

            <div className="flex gap-2 mb-4 justify-center">
              <Button
                variant={votes[`${selectedText.slice(0, 50)}...`] === 'like' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote(selectedText, 'like')}
                className="flex items-center gap-1"
              >
                👍 Like
              </Button>
              <Button
                variant={votes[`${selectedText.slice(0, 50)}...`] === 'dislike' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleVote(selectedText, 'dislike')}
                className="flex items-center gap-1"
              >
                👎 Dislike
              </Button>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" disabled>
                💬 Reply to this (Demo)
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowModal(false);
                  setSelectedText("");
                  window.getSelection()?.removeAllRanges();
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
