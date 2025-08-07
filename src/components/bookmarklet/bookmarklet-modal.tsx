"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookmarkletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookmarkletModal({ isOpen, onClose }: BookmarkletModalProps) {
  const [bookmarkletUrl, setBookmarkletUrl] = useState('');

  // Set up bookmarklet using DOM manipulation to bypass React security
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        const button = document.getElementById('bookmarklet-button-modal');
        if (button && !button.getAttribute('data-converted')) {
          const bookmarkletCode = `(function(){try{console.log('=== VANWINKLE BOOKMARKLET v2 DEBUG ===');console.log('URL:',window.location.href);console.log('Document ready state:',document.readyState);var messages=Array.from(document.querySelectorAll('main .min-h-\\\\[20px\\\\], main .prose')).map(function(el){return el.innerText;});console.log('Found messages:',messages.length);if(messages.length>0){console.log('First message preview:',messages[0].substring(0,100));}if(messages.length===0){alert('❌ No messages found.\\\\n\\\\nFound selectors: '+document.querySelectorAll('main .min-h-\\\\[20px\\\\], main .prose').length+'\\\\nTry a different ChatGPT page.');return;}var formatted=messages.map(function(text,i){return i%2===0?'🧑 You:\\\\n'+text:'🤖 ChatGPT:\\\\n'+text;}).join('\\\\n\\\\n---\\\\n\\\\n');console.log('Formatted length:',formatted.length);console.log('Clipboard available:',!!navigator.clipboard);console.log('writeText available:',!!(navigator.clipboard&&navigator.clipboard.writeText));setTimeout(function(){if(navigator.clipboard&&navigator.clipboard.writeText){console.log('🔄 Attempting clipboard write...');navigator.clipboard.writeText(formatted).then(function(){console.log('✅ SUCCESS: Clipboard write completed');console.log('Opening Vanwinkle...');window.open('https://vanwinkle.vercel.app/submit?from=bookmarklet','_blank');alert('✅ SUCCESS!\\\\n\\\\nCopied '+formatted.length+' characters to clipboard.\\\\n\\\\nVanwinkle is opening - click \\"Paste from Clipboard\\"');}).catch(function(err){console.error('❌ CLIPBOARD FAILED:',err);console.log('Error name:',err.name);console.log('Error message:',err.message);alert('❌ CLIPBOARD FAILED\\\\n\\\\nError: '+err.message+'\\\\n\\\\nTry clicking the page first, then run bookmarklet again.');});}else{console.log('❌ No clipboard support');alert('❌ No clipboard support in this browser');}},500);}catch(e){console.error('BOOKMARKLET ERROR:',e);alert('❌ BOOKMARKLET ERROR\\\\n\\\\n'+e.message);}})();`;
          
          // Create an actual anchor element and set its href
          const link = document.createElement('a');
          link.href = `javascript:${bookmarkletCode}`;
          link.innerHTML = button.innerHTML;
          link.className = button.className;
          link.draggable = true;
          link.setAttribute('data-converted', 'true');
          
          // Replace the div with the anchor
          if (button.parentNode) {
            button.parentNode.replaceChild(link, button);
          }
          
          setBookmarkletUrl(`javascript:${bookmarkletCode}`);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span className="text-2xl">🚀</span>
            Install Vanwinkle Bookmarklet
          </DialogTitle>
          <DialogDescription>
            Get started in 10 seconds - instantly share your ChatGPT, Claude, or other AI conversations with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Installation Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Step 1: Drag this button to your bookmarks bar ↓
              </h3>
              
              <div 
                id="bookmarklet-button-modal"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg cursor-grab active:cursor-grabbing select-none transition-colors duration-200 shadow-lg hover:shadow-xl"
                draggable={true}
              >
                📚 Save to Vanwinkle
              </div>
              
              <div className="text-sm text-blue-700 space-y-2 mt-4">
                <p><strong>Step 2:</strong> Go to a ChatGPT conversation or share page</p>
                <p><strong>Step 3:</strong> Click anywhere on the page first, then click the bookmark</p>
                <div className="bg-blue-100 p-3 rounded border border-blue-300 mt-3">
                  <p className="text-green-700">✅ <strong>Auto-copies to clipboard + opens Vanwinkle</strong></p>
                  <p className="text-blue-600">💡 <strong>Mac app users:</strong> Share → Open in browser → Use bookmarklet</p>
                  <p className="text-red-600">⚠️ <strong>Fallback:</strong> Downloads file if clipboard fails</p>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 Can't drag?</h4>
            <p className="text-sm text-yellow-700 mb-2">
              Right-click the button above → "Bookmark this link" or "Add to bookmarks"
            </p>
            <details className="text-sm text-yellow-700">
              <summary className="cursor-pointer font-medium hover:text-yellow-800">
                ▶ Alternative: Manual Setup
              </summary>
              <div className="mt-2 p-3 bg-yellow-100 rounded border">
                <p className="mb-2">1. Right-click your bookmarks bar → "Add page" or "New bookmark"</p>
                <p className="mb-2">2. Name: <code className="bg-yellow-200 px-1 rounded">Save to Vanwinkle</code></p>
                <p className="mb-2">3. URL: Copy this entire code:</p>
                <textarea 
                  className="w-full h-20 text-xs bg-white border border-yellow-300 rounded p-2 font-mono"
                  readOnly
                  value={bookmarkletUrl}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
            </details>
          </div>

          {/* How it Works */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">🔍 How it works:</h4>
            <ol className="list-decimal list-inside text-sm text-green-700 space-y-1">
              <li>In ChatGPT mobile: Share → Copy link</li>
              <li>Paste that share URL here and save</li>
              <li>On desktop: See notification → Click "Open ChatGPT"</li>
              <li>Use our bookmarklet to import the full conversation</li>
            </ol>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
