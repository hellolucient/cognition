"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TextSelectionDebugPage() {
  const [selectedText, setSelectedText] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Also try with native DOM event listeners
  useEffect(() => {
    const handleDocumentMouseUp = () => {
      try {
        console.log('🔍 Document mouseup fired!');
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        console.log('🔍 Document selection:', text);
      } catch (error) {
        console.error('🔍 Error in document mouseup:', error);
      }
    };

    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => document.removeEventListener('mouseup', handleDocumentMouseUp);
  }, []);

  const handleTextSelection = (event: React.MouseEvent) => {
    try {
      console.log('🔍 onMouseUp event fired!', event);
      
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      console.log('🔍 Text Selection Debug:', {
        selection,
        selectedText,
        length: selectedText?.length,
        rangeCount: selection?.rangeCount
      });
      
      if (selectedText && selectedText.length > 5) {
        console.log('✅ Text selection valid, showing modal');
        setSelectedText(selectedText);
        setShowModal(true);
      } else {
        console.log('❌ Text selection invalid:', {
          hasText: !!selectedText,
          length: selectedText?.length,
          minLength: 5
        });
      }
    } catch (error) {
      console.error('🔍 Error in text selection handler:', error);
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

        <div className="bg-gray-50 p-4 rounded border">
          <h2 className="text-base font-medium mb-3 text-gray-900">Test Content</h2>
          <div 
            className="text-gray-800 select-text cursor-text space-y-3 border border-gray-300 p-3 rounded bg-white"
            onMouseUp={handleTextSelection}
            onMouseDown={() => console.log('🔍 onMouseDown fired!')}
            onClick={() => console.log('🔍 onClick fired!')}
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

        <div className="bg-gray-50 p-4 rounded border">
          <h3 className="font-medium text-gray-900 mb-2">Debug Info:</h3>
          <p className="text-sm text-gray-700 mb-1">Open browser console to see selection debug logs.</p>
          <p className="text-sm text-gray-700 mb-2">Selected text length must be &gt; 5 characters.</p>
          <p className="text-xs text-gray-600">
            <strong>Events to watch for:</strong><br/>
            • onMouseDown (when you press mouse)<br/>
            • onMouseUp (when you release mouse)<br/>
            • onClick (single click)<br/>
          </p>
          <Button 
            onClick={() => console.log('🔍 Manual test - current selection:', window.getSelection()?.toString())}
            size="sm"
            className="mt-2"
          >
            Test Current Selection
          </Button>
        </div>
      </div>

      {/* Debug Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4 shadow-lg">
            <h3 className="text-base font-medium mb-3 text-gray-900">✅ Text Selection Working!</h3>
            <div className="bg-gray-50 p-2 rounded mb-3 border">
              <div className="text-xs text-gray-600 mb-1">
                You selected:
              </div>
              <div className="text-sm text-gray-900">"{selectedText}"</div>
            </div>
            <p className="text-gray-600 mb-3 text-xs">
              Length: {selectedText.length} characters
            </p>
            <div className="flex">
              <Button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedText("");
                  window.getSelection()?.removeAllRanges();
                }}
                size="sm"
                variant="outline"
                className="w-full"
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
