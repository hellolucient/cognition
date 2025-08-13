"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TextSelectionDebugPage() {
  const [selectedText, setSelectedText] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    console.log('🔍 Text Selection Debug:', {
      selection,
      selectedText,
      length: selectedText?.length
    });
    
    if (selectedText && selectedText.length > 5) {
      setSelectedText(selectedText);
      setShowModal(true);
    }
  };

  return (
    <main className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <Button variant="outline" asChild className="mb-4">
            <Link href="/">← Back to Feed</Link>
          </Button>
          <h1 className="text-3xl font-bold">Text Selection Debug</h1>
          <p className="text-muted-foreground">
            Test the text highlighting feature by selecting text below.
          </p>
        </div>

        <div className="bg-muted p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Test Content</h2>
          <div 
            className="text-gray-800 select-text cursor-text space-y-4"
            onMouseUp={handleTextSelection}
          >
            <p>
              This is a test paragraph for text selection. Try highlighting some of this text 
              to see if the selection modal appears. The text needs to be longer than 5 characters 
              for the modal to trigger.
            </p>
            <p>
              Here's another paragraph with different content. You can select text from either 
              paragraph to test the functionality. The selection should trigger a modal that 
              shows the selected text.
            </p>
            <p>
              <strong>Instructions:</strong> Click and drag to select text, then release the mouse 
              button. A modal should appear showing your selection.
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded border">
          <h3 className="font-semibold">Debug Info:</h3>
          <p>Open browser console to see selection debug logs.</p>
          <p>Selected text length must be &gt; 5 characters.</p>
        </div>
      </div>

      {/* Debug Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">✅ Text Selection Working!</h3>
            <div className="bg-muted p-3 rounded mb-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                You selected:
              </div>
              <div className="text-sm italic">"{selectedText}"</div>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">
              Length: {selectedText.length} characters
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedText("");
                  window.getSelection()?.removeAllRanges();
                }}
                className="flex-1"
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
