"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookmarkletModal } from "@/components/bookmarklet/bookmarklet-modal";

export default function InstallPage() {
  const [showBookmarkletModal, setShowBookmarkletModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Static background similar to home page */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img src="/vanwinkle_logo.png" alt="vanwinkle" className="h-20 w-auto" />
          </div>

          {/* Hero section */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
              Install vanwinkle
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Get started in 10 seconds - instantly share conversations from ChatGPT, Claude, Perplexity, Grok, Gemini, Copilot, and more!
            </p>
          </div>

          {/* Installation CTA */}
          <div className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 rounded-2xl p-8 shadow-xl">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-900">
                Step 1: Install the Bookmarklet
              </h2>
              <p className="text-gray-700 text-lg">
                Drag the button below to your bookmarks bar, then use it on any AI conversation page.
              </p>
              
              <Button 
                onClick={() => setShowBookmarkletModal(true)} 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                🚀 Install Bookmarklet
              </Button>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">How it works:</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">1</span>
                <p className="text-gray-700">Install the bookmarklet to your browser's bookmarks bar</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">2</span>
                <p className="text-gray-700">Go to any AI conversation (ChatGPT, Claude, Perplexity, etc.)</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">3</span>
                <p className="text-gray-700">Click the bookmarklet → It automatically extracts and copies your conversation</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">4</span>
                <p className="text-gray-700">vanwinkle opens with your conversation ready to share with the community</p>
              </div>
            </div>
          </div>

          {/* Supported platforms */}
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Supported AI Platforms:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span>ChatGPT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span>Claude</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span>Perplexity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span>Grok</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span>Gemini</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span>Copilot</span>
              </div>
            </div>
          </div>

          {/* Coming soon notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">🚧 Coming Soon</h3>
            <p className="text-amber-700">
              vanwinkle is currently in development. Install the bookmarklet now and be ready to share your AI conversations when we launch!
            </p>
          </div>
        </div>
      </div>

      {/* Bookmarklet Modal */}
      <BookmarkletModal 
        isOpen={showBookmarkletModal} 
        onClose={() => setShowBookmarkletModal(false)} 
      />
    </div>
  );
}
